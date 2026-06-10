import rembg
from PIL import Image

def process_image(input_path, output_path):
    # 1. Use rembg to perfectly remove the background
    with open(input_path, 'rb') as i:
        input_data = i.read()
    
    output_data = rembg.remove(input_data)
    
    # Write temporary file
    temp_path = input_path + "_temp.png"
    with open(temp_path, 'wb') as o:
        o.write(output_data)
        
    # 2. Open with PIL and crop extra spaces
    img = Image.open(temp_path).convert("RGBA")
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
        
    img.save(output_path, "PNG")
    
    # Cleanup temp file
    import os
    if os.path.exists(temp_path):
        os.remove(temp_path)

process_image("assets/img/logo.png", "assets/img/logo.png")
print("Logo successfully processed and cropped with rembg!")
