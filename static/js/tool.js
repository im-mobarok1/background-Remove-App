// Background Removal Tool JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');
    const uploadBox = document.getElementById('uploadBox');
    const fileInfo = document.getElementById('fileInfo');
    const fileName = document.getElementById('fileName');
    const fileSize = document.getElementById('fileSize');
    const removeFile = document.getElementById('removeFile');
    const uploadSection = document.querySelector('.upload-section');
    const processingSection = document.getElementById('processingSection');
    const previewSection = document.getElementById('previewSection');
    const originalPreview = document.getElementById('originalPreview');
    const processedPreview = document.getElementById('processedPreview');
    const downloadBtn = document.getElementById('downloadBtn');
    const progressBar = document.getElementById('progressBar');
    const processAnother = document.getElementById('processAnother');
    const viewOriginal = document.getElementById('viewOriginal');
    
    let currentFile = null;
    let originalImageUrl = null;
    let processedImageUrl = null;

    // Event Listeners
    uploadBtn.addEventListener('click', () => fileInput.click());
    uploadBox.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', handleFileSelect);
    removeFile.addEventListener('click', resetFile);
    processAnother.addEventListener('click', resetTool);
    
    // Drag & Drop
    uploadBox.addEventListener('dragover', handleDragOver);
    uploadBox.addEventListener('dragleave', handleDragLeave);
    uploadBox.addEventListener('drop', handleDrop);
    
    // Functions
    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && validateFile(file)) {
            currentFile = file;
            showFileInfo(file);
            previewOriginalImage(file);
            startProcessing();
        } else {
            showNotification('Please upload a valid image file (PNG, JPG, WEBP, max 10MB)', 'error');
        }
    }
    
    function validateFile(file) {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB
        
        if (!allowedTypes.includes(file.type)) {
            return false;
        }
        
        if (file.size > maxSize) {
            return false;
        }
        
        return true;
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        uploadBox.classList.add('dragover');
    }
    
    function handleDragLeave() {
        uploadBox.classList.remove('dragover');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        uploadBox.classList.remove('dragover');
        
        const file = e.dataTransfer.files[0];
        if (file && validateFile(file)) {
            currentFile = file;
            fileInput.files = e.dataTransfer.files;
            showFileInfo(file);
            previewOriginalImage(file);
            startProcessing();
        } else {
            showNotification('Please upload a valid image file (PNG, JPG, WEBP, max 10MB)', 'error');
        }
    }
    
    function showFileInfo(file) {
        fileInfo.style.display = 'flex';
        fileName.textContent = file.name;
        fileSize.textContent = formatFileSize(file.size);
    }
    
    function previewOriginalImage(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            originalPreview.innerHTML = `<img src="${e.target.result}" alt="Original">`;
            originalImageUrl = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    function startProcessing() {
        if (!currentFile) return;
        
        // Show processing section
        uploadSection.style.display = 'none';
        processingSection.style.display = 'block';
        
        // Animate progress bar
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            progressBar.style.width = `${progress}%`;
            
            if (progress >= 100) {
                clearInterval(interval);
                processImage();
            }
        }, 300);
    }
    
    async function processImage() {
        try {
            const formData = new FormData();
            formData.append('image', currentFile);
            
            const response = await fetch('/bg-remove/upload/', {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrftoken
                }
            });
            
            const data = await response.json();
            
            if (data.success) {
                showResult(data.processed_url, data.original_url);
                showNotification('Background removed successfully!', 'success');
            } else {
                throw new Error(data.error);
            }
        } catch (error) {
            console.error('Error:', error);
            showNotification(`Error: ${error.message}`, 'error');
            // Fallback to demo result
            showDemoResult();
        }
    }
    
    function showResult(processedUrl, originalUrl) {
        // Update processed image
        processedPreview.innerHTML = `<img src="${processedUrl}" alt="Background Removed">`;
        processedImageUrl = processedUrl;
        
        // Update download button
        downloadBtn.href = processedUrl;
        downloadBtn.download = `bg-removed-${currentFile.name.split('.')[0]}.png`;
        
        // Show preview section
        processingSection.style.display = 'none';
        previewSection.style.display = 'block';
    }
    
    function showDemoResult() {
        // For demo purposes, show a processed version
        processedPreview.innerHTML = `
            <div style="position: relative;">
                <img src="${originalImageUrl}" alt="Original" style="opacity: 0.3;">
                <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: #10b981; margin-bottom: 1rem;"></i>
                    <p>Background removed (demo mode)</p>
                </div>
            </div>
        `;
        
        downloadBtn.href = originalImageUrl;
        downloadBtn.download = `original-${currentFile.name}`;
        
        processingSection.style.display = 'none';
        previewSection.style.display = 'block';
    }
    
    function resetFile() {
        fileInput.value = '';
        fileInfo.style.display = 'none';
        currentFile = null;
        originalPreview.innerHTML = '<div class="image-placeholder"><i class="fas fa-image"></i></div>';
    }
    
    function resetTool() {
        resetFile();
        previewSection.style.display = 'none';
        processingSection.style.display = 'none';
        uploadSection.style.display = 'block';
        progressBar.style.width = '0%';
        processedPreview.innerHTML = '<div class="image-placeholder"><i class="fas fa-magic"></i></div>';
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            notification.remove();
        }, 5000);
        
        // Close button
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
    
    // Add notification styles
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        }
        
        .notification-success {
            background: #10b981;
            color: white;
        }
        
        .notification-error {
            background: #ef4444;
            color: white;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            padding: 0.25rem;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
});