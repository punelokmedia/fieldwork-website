from PIL import Image

def find_box(img_path):
    img = Image.open(img_path).convert("RGBA")
    width, height = img.size
    
    # We want to find the largest contiguous transparent or white area. 
    # Or just the bounds where alpha == 0
    top_y = height
    bottom_y = -1
    left_x = width
    right_x = -1
    
    pixels = img.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Consider transparent (alpha < 255) OR pure white (255, 255, 255, 255) as part of the "empty" space 
            # where the video should probably go. Actually, maybe just look at alpha.
            if a < 128:
                if y < top_y: top_y = y
                if y > bottom_y: bottom_y = y
                if x < left_x: left_x = x
                if x > right_x: right_x = x
                
    print(f"BBOX of transparent region: left={left_x}, top={top_y}, right={right_x}, bottom={bottom_y}")
    
find_box("client/images/rell.png")
