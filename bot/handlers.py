import os
import asyncio
import time
import shlex
import uuid
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from telegram.constants import ParseMode

from .config import DOWNLOAD_PATH
from .session import session_manager
from .extractor import extractor, AuthenticationError
from .downloader import downloader
from .splitter import splitter
from .uploader import uploader
from .utils import cleanup_temp_dir, human_readable_size, sanitize_filename
from .logger import logger

class BotHandlers:
    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await update.message.reply_text(
            "Welcome to the High-Performance Video Splitter Bot!\n"
            "Send me any video URL, and I will download and split it for you."
        )

    async def handle_url(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        url = update.message.text.strip()
        user_id = update.effective_user.id

        # Check if user is already processing
        lock = session_manager.get_user_lock(user_id)
        if lock.locked():
            await update.message.reply_text("You already have a task in progress. Please wait until it finishes.")
            return

        status_msg = await update.message.reply_text("Analyzing URL...")

        # We acquire the lock for the extraction phase.
        # Note: If we release it after extraction, user can send another URL.
        # But we want to prevent that until download is done?
        # Actually, if we release lock, user can start another analysis.
        # But if they start download, we need lock again.
        # Best to keep lock? No, user interaction involves waiting for user input.
        # So we release lock after extraction, but re-acquire for download.
        # But we need to ensure context.user_data isn't overwritten?
        # If user sends URL 2 while URL 1 is waiting for selection, URL 2 overwrites.
        # That's acceptable behavior (latest URL takes precedence).

        async with lock:
            try:
                # Run extraction in thread to avoid blocking loop
                info = await asyncio.to_thread(extractor.get_info, url)

                # Generate unique request ID to handle multiple requests
                request_id = str(uuid.uuid4())

                # Store info with request_id key
                if 'requests' not in context.user_data:
                    context.user_data['requests'] = {}

                context.user_data['requests'][request_id] = {
                    'video_info': info,
                    'url': url
                }

                keyboard = []
                formats = info.get('formats', [])

                # Limit to top 10 unique resolutions
                # Assuming formats are sorted or we just take first 10
                for fmt in formats[:10]:
                    res = fmt.get('resolution', 'Unknown')
                    size = fmt.get('filesize_str', '?')
                    fid = fmt.get('format_id')
                    text = f"{res} ({size})"
                    # callback_data limit is 64 bytes.
                    # request_id (36) + dl_ (3) + _ (1) + fid (avg 3-5) = ~45 chars. Safe.
                    callback_data = f"dl_{request_id}_{fid}"
                    keyboard.append([InlineKeyboardButton(text, callback_data=callback_data)])

                keyboard.append([InlineKeyboardButton("Cancel", callback_data="cancel")])

                title = info.get('title', 'Unknown')
                duration = info.get('duration', 0)

                await status_msg.edit_text(
                    f"Title: {title}\n"
                    f"Duration: {duration}s\n"
                    f"Select Quality:",
                    reply_markup=InlineKeyboardMarkup(keyboard)
                )

            except AuthenticationError as e:
                await status_msg.edit_text(str(e))
            except Exception as e:
                logger.error(f"Error handling URL {url}: {e}")
                await status_msg.edit_text(f"Error analyzing URL: {e}")

    async def handle_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        query = update.callback_query
        await query.answer()

        data = query.data
        if data == "cancel":
            await query.edit_message_text("Cancelled.")
            return

        if not data.startswith("dl_"):
            return

        # Parse request_id and format_id
        # dl_{request_id}_{format_id}
        parts = data.split('_')
        if len(parts) < 3:
            return

        request_id = parts[1]
        format_id = "_".join(parts[2:]) # format_id might contain underscores? Usually numeric or small string.

        user_id = update.effective_user.id

        lock = session_manager.get_user_lock(user_id)
        if lock.locked():
            await query.edit_message_text("You already have a task in progress.")
            return

        # Acquire user lock for the duration of download
        async with lock:
            await query.edit_message_text("Queued for download...")

            async with session_manager.semaphore:
                await self._process_download(update, context, request_id, format_id, query.message)

    async def _process_download(self, update, context, request_id, format_id, status_msg):
        requests = context.user_data.get('requests', {})
        request_data = requests.get(request_id)

        user_id = update.effective_user.id
        username = update.effective_user.username

        log_ctx = {'user_id': user_id, 'username': username}

        if not request_data:
            await status_msg.edit_text("Session expired or invalid. Please send the URL again.")
            logger.warning(f"Session expired for user {user_id}", extra=log_ctx)
            return

        url = request_data['url']
        info = request_data['video_info']

        log_ctx['url'] = url

        title = info.get('title', 'Video')
        user_dir = os.path.join(DOWNLOAD_PATH, str(user_id))

        if not os.path.exists(user_dir):
            os.makedirs(user_dir)

        try:
            logger.info(f"Starting download process for {url}", extra=log_ctx)
            last_update_time = 0
            current_part = 0
            total_parts = 0

            async def progress_hook(stage, percent_or_sent, total=None):
                nonlocal last_update_time
                current_time = time.time()

                # Update every 5 seconds or if finished
                if stage != "finished" and current_time - last_update_time < 5:
                    return

                last_update_time = current_time
                text = ""

                if stage == "downloading":
                    text = f"Downloading: {percent_or_sent}"
                elif stage == "splitting":
                    text = "Splitting video..."
                elif stage == "uploading":
                     # Concurrent upload progress
                     p = (percent_or_sent / total * 100) if total else 0
                     text = f"Uploading: {p:.1f}% ({human_readable_size(percent_or_sent)} / {human_readable_size(total)})"
                elif stage == "finished":
                    text = "Processing complete!"

                if text:
                    try:
                        await status_msg.edit_text(text)
                    except Exception:
                        pass

            # Download
            await status_msg.edit_text("Starting download...")
            file_path = await downloader.download_video(url, format_id, user_dir, progress_hook, user_context=log_ctx)

            # Split
            await status_msg.edit_text("Splitting video...")
            chunks = await splitter.split_file(file_path)
            total_parts = len(chunks)

            # Prepare for concurrent upload
            await status_msg.edit_text(f"Uploading {total_parts} parts...")

            total_size_all = sum(os.path.getsize(c) for c in chunks)
            uploaded_bytes_per_chunk = [0] * total_parts

            upload_semaphore = asyncio.Semaphore(3) # Max 3 concurrent uploads
            upload_tasks = []

            async def upload_worker(index, chunk_path):
                async with upload_semaphore:
                    current_part = index + 1
                    # chunk_name = os.path.basename(chunk_path)
                    caption = f"{title} — Part {current_part} of {total_parts}"

                    # Simulated progress for simple uploader
                    async def chunk_progress(sent, total):
                        # With standard uploader, we only know start (0%) and end (100%).
                        # This avoids complex wrappers and "unofficial" hacks.
                        uploaded_bytes_per_chunk[index] = sent
                        total_uploaded = sum(uploaded_bytes_per_chunk)
                        await progress_hook("uploading", total_uploaded, total_size_all)

                    # Pass context.bot
                    await uploader.upload_chunk(context.bot, update.effective_chat.id, chunk_path, caption, chunk_progress)

            for i, chunk_path in enumerate(chunks):
                upload_tasks.append(asyncio.create_task(upload_worker(i, chunk_path)))

            await asyncio.gather(*upload_tasks)

            await status_msg.edit_text("All parts sent!")

            if total_parts > 1:
                # Generate specific merge instructions
                safe_title = sanitize_filename(title)

                # Linux/macOS command (using shlex.quote for safety)
                linux_filenames = [shlex.quote(os.path.basename(c)) for c in chunks]
                linux_output = shlex.quote(f"{safe_title} - Full.mp4")
                linux_cmd = f"cat {' '.join(linux_filenames)} > {linux_output}"

                # Windows CMD command (using double quotes)
                win_filenames = [f'"{os.path.basename(c)}"' for c in chunks]
                windows_cmd = f"copy /b {'+'.join(win_filenames)} \"{safe_title} - Full.mp4\""

                # Truncate if too long (Telegram limit 4096 chars)
                if len(linux_cmd) > 1000:
                    linux_cmd = "cat \"Part A...\" ... > \"Full.mp4\" (too many parts to list)"
                if len(windows_cmd) > 1000:
                    windows_cmd = "copy /b ... (too many parts to list)"

                instructions = (
                    "To merge these parts:\n\n"
                    "*Linux/macOS:*\n"
                    f"`{linux_cmd}`\n\n"
                    "*Windows CMD:*\n"
                    f"`{windows_cmd}`\n\n"
                    "*Android:* Use MiXplorer or Total Commander."
                )

                await status_msg.reply_text(instructions, parse_mode=ParseMode.MARKDOWN)

        except Exception as e:
            logger.error(f"Process failed for user {user_id}: {e}", extra=log_ctx)
            await status_msg.edit_text(f"Task failed: {e}")
        finally:
            cleanup_temp_dir(user_dir)
            # Clean up request data
            if 'requests' in context.user_data and request_id in context.user_data['requests']:
                del context.user_data['requests'][request_id]

handlers = BotHandlers()
