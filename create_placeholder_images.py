#!/usr/bin/env python3
"""
Create placeholder images for Dentscape annotations
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_placeholder_image(filename, text, size=(400, 300)):
    """Create a placeholder image with text"""
    # Create image with white background
    img = Image.new('RGB', size, color='white')
    draw = ImageDraw.Draw(img)
    
    # Try to use a default font, fallback to basic if not available
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 20)
    except:
        font = ImageFont.load_default()
    
    # Get text size for centering
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    # Calculate position to center text
    x = (size[0] - text_width) // 2
    y = (size[1] - text_height) // 2
    
    # Draw text
    draw.text((x, y), text, fill='black', font=font)
    
    # Draw a border
    draw.rectangle([0, 0, size[0]-1, size[1]-1], outline='gray', width=2)
    
    # Save image
    img.save(filename)
    print(f"Created: {filename}")

def main():
    """Create all placeholder images"""
    
    # Ensure directory exists
    os.makedirs("static/dentscape", exist_ok=True)
    
    # Create placeholder images
    placeholders = [
        ("static/dentscape/smile_curve_annotated.jpg", "Smile Curve Analysis\nAnnotated Image"),
        ("static/dentscape/e_line_annotated.jpg", "E-Line Analysis\nAnnotated Image"),
        ("static/dentscape/tooth_segmentation_annotated.jpg", "Tooth Segmentation\nAnnotated Image"),
        ("static/dentscape/incisor_ratio_annotated.jpg", "Incisor Ratio Analysis\nAnnotated Image"),
        ("static/dentscape/incisal_plane_annotated.jpg", "Incisal Plane Analysis\nAnnotated Image"),
        ("static/dentscape/interdental_proportion_annotated.jpg", "Interdental Proportion\nAnnotated Image"),
    ]
    
    for filename, text in placeholders:
        create_placeholder_image(filename, text)
    
    print("\n✅ All placeholder images created successfully!")
    print("📁 Location: static/dentscape/")
    print("🔗 These images will be accessible at: /static/dentscape/[filename]")

if __name__ == "__main__":
    main()




