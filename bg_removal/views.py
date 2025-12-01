import os
import requests
from django.shortcuts import render
from django.http import JsonResponse
from django.core.files.storage import FileSystemStorage
from django.views.decorators.csrf import ensure_csrf_cookie
from django.conf import settings
from PIL import Image
import io

@ensure_csrf_cookie
def bg_remove_tool(request):
    return render(request, 'bg_removal/tool.html')

def upload_image(request):
    if request.method == 'POST' and request.FILES.get('image'):
        try:
            uploaded_file = request.FILES['image']
            fs = FileSystemStorage()
            
            # Validate file
            if not validate_file(uploaded_file):
                return JsonResponse({
                    'success': False,
                    'error': 'Invalid file. Please upload PNG, JPG, or WEBP image under 10MB.'
                })
            
            # Save original image
            original_filename = fs.save(uploaded_file.name, uploaded_file)
            original_path = fs.path(original_filename)
            original_url = fs.url(original_filename)
            
            # Process image
            processed_url = remove_background_api(original_path, fs)
            
            return JsonResponse({
                'success': True,
                'original_url': original_url,
                'processed_url': processed_url,
                'message': 'Background removed successfully!'
            })
            
        except Exception as e:
            print(f"Error: {str(e)}")
            return JsonResponse({
                'success': False,
                'error': f'Processing failed: {str(e)}'
            })
    
    return JsonResponse({
        'success': False,
        'error': 'No file uploaded'
    })

def validate_file(file):
    """Validate uploaded file"""
    allowed_types = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    max_size = 10 * 1024 * 1024  # 10MB
    
    if file.content_type not in allowed_types:
        return False
    
    if file.size > max_size:
        return False
    
    return True

def remove_background_api(input_path, fs):
    """Remove background using Remove.bg API"""
    api_key = settings.REMOVE_BG_API_KEY
    
    if not api_key or api_key == 'your_remove_bg_api_key_here':
        # Demo mode - simulate processing
        return simulate_background_removal(input_path, fs)
    
    try:
        # Read image file
        with open(input_path, 'rb') as image_file:
            image_data = image_file.read()
        
        # API request
        response = requests.post(
            'https://api.remove.bg/v1.0/removebg',
            files={'image_file': image_data},
            data={'size': 'auto', 'format': 'png'},
            headers={'X-Api-Key': api_key},
            timeout=30
        )
        
        if response.status_code == 200:
            # Save processed image
            original_name = os.path.basename(input_path)
            name, ext = os.path.splitext(original_name)
            output_filename = f"{name}_no_bg.png"
            output_path = fs.path(output_filename)
            
            with open(output_path, 'wb') as out:
                out.write(response.content)
            
            return fs.url(output_filename)
        else:
            raise Exception(f"API Error: {response.status_code}")
            
    except requests.exceptions.Timeout:
        raise Exception("Request timeout. Please try again.")
    except Exception as e:
        raise Exception(f"API processing failed: {str(e)}")

def simulate_background_removal(input_path, fs):
    """Simulate background removal for demo"""
    try:
        # Open and process image
        image = Image.open(input_path)
        
        if image.mode != 'RGBA':
            image = image.convert('RGBA')
        
        pixels = image.load()
        width, height = image.size
        
        # Simple background detection (for demo)
        for y in range(height):
            for x in range(width):
                r, g, b, a = pixels[x, y]
                
                # Remove white/light backgrounds
                if r > 200 and g > 200 and b > 200:
                    pixels[x, y] = (255, 255, 255, 0)
                # Remove edge pixels
                elif x < 10 or y < 10 or x > width-11 or y > height-11:
                    if r + g + b > 400:
                        pixels[x, y] = (255, 255, 255, 0)
        
        # Save result
        original_name = os.path.basename(input_path)
        output_filename = f"{os.path.splitext(original_name)[0]}_no_bg.png"
        output_path = fs.path(output_filename)
        
        image.save(output_path, 'PNG')
        return fs.url(output_filename)
        
    except Exception as e:
        raise Exception(f"Demo processing failed: {str(e)}")