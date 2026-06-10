from PIL import Image

def resize_icon(input_path, output_path, size):
    img = Image.open(input_path).convert("RGBA")
    
    # Calculate aspect ratio
    w, h = img.size
    
    # Create a transparent square canvas
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 0))
    
    # Resize image to fit inside canvas with padding
    # Let's add a slight 10% padding
    pad = int(size * 0.1)
    target_size = size - 2 * pad
    
    if w > h:
        new_w = target_size
        new_h = int(h * (target_size / w))
    else:
        new_h = target_size
        new_w = int(w * (target_size / h))
        
    img_resized = img.resize((new_w, new_h), Image.Resampling.LANCZOS)
    
    # Paste into center
    x = (size - new_w) // 2
    y = (size - new_h) // 2
    canvas.paste(img_resized, (x, y), img_resized)
    
    canvas.save(output_path, "PNG")

resize_icon("assets/img/logo.png", "assets/img/icon-192x192.png", 192)
resize_icon("assets/img/logo.png", "assets/img/icon-512x512.png", 512)
print("PWA icons generated successfully!")
