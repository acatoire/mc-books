"""Script to update YAML files with correct image paths for each animal in the Naturalist Add-On."""

import os
from pathlib import Path
import yaml
from PIL import Image

def update_yaml_images(animal_dir):
    """Update YAML file with images found in the animal directory.
    
    Args:
        animal_dir: Path to the animal directory containing images and YAML file
    """
    # Get all image files in the directory
    image_files = []
    gif_files = []
    variation_gif = None
    item_images = []

    for file in os.listdir(animal_dir):
        lower_file = file.lower()
        if lower_file.endswith(('.png', '.jpg', '.jpeg', '.gif')):
            if lower_file.endswith('.gif'):
                gif_files.append(file)
                if '_variation' in lower_file:
                    variation_gif = file
            else:
                try:
                    with Image.open(os.path.join(animal_dir, file)) as img:
                        if img.size == (512, 512):
                            item_images.append(file)
                        else:
                            image_files.append(file)
                except Exception as e:
                    print(f"Error checking image dimensions for {file}: {e}")
                    image_files.append(file)

    if not image_files and not item_images and not gif_files:
        print(f"No images found in {animal_dir}")
        return

    # Get the YAML file path
    animal_name = os.path.basename(animal_dir).replace('a_', '')
    yaml_file = os.path.join(animal_dir, f"{animal_name}.yaml")

    if not os.path.exists(yaml_file):
        print(f"YAML file not found for {animal_dir}")
        return

    # Read the YAML file
    with open(yaml_file, 'r', encoding='utf-8') as f:
        try:
            data = yaml.safe_load(f)
        except yaml.YAMLError as e:
            print(f"Error reading YAML file {yaml_file}: {e}")
            return

    # Update the images section
    if 'images' not in data:
        data['images'] = {}

    # Set main image (prefer variation GIF, then any GIF, then other images)
    if variation_gif:
        data['images']['main'] = variation_gif
    elif gif_files:
        data['images']['main'] = gif_files[0]
    elif image_files:
        data['images']['main'] = image_files[0]

    # Update gallery with GIFs first, then other images
    gallery_images = gif_files + image_files
    if gallery_images:
        data['images']['gallery'] = gallery_images

    # Add 512x512 images to items section
    if item_images:
        data['images']['items'] = item_images

    # Write back to the YAML file
    with open(yaml_file, 'w', encoding='utf-8') as f:
        yaml.dump(data, f, allow_unicode=True, sort_keys=False)

    print(f"Updated {yaml_file}")
    if gallery_images:
        print(f"Added {len(gallery_images)} images to gallery ({len(gif_files)} GIFs first)")
    if item_images:
        print(f"Added {len(item_images)} 512x512 images to items section")
    if variation_gif:
        print(f"Selected variation GIF as main image: {variation_gif}")
    elif gif_files:
        print(f"Selected first GIF as main image: {gif_files[0]}")

def main():
    """Process all animal directories and update their YAML files with image information."""
    animal_base_dir = Path("animal")

    if not animal_base_dir.exists():
        print("Animal directory not found!")
        return

    # Process each animal directory
    for animal_dir in animal_base_dir.iterdir():
        if animal_dir.is_dir() and animal_dir.name.startswith('a_'):
            print(f"\nProcessing {animal_dir.name}...")
            update_yaml_images(animal_dir)

if __name__ == "__main__":
    main()
