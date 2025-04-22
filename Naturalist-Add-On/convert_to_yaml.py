import os
import yaml
import re
from pathlib import Path

def extract_content_from_markdown(md_file):
    with open(md_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract title
    title_match = re.search(r'# (.*?)\n', content)
    title = title_match.group(1) if title_match else ""
    
    # Extract last updated
    last_updated_match = re.search(r'Last Updated: (.*?)\n', content)
    last_updated = last_updated_match.group(1) if last_updated_match else ""
    
    # Extract description
    description_match = re.search(r'---\n\n(.*?)\n\n<aside>', content, re.DOTALL)
    description = description_match.group(1).strip() if description_match else ""
    
    # Extract stats
    stats = {}
    health_match = re.search(r'Health: (\d+)', content)
    if health_match:
        stats['health'] = int(health_match.group(1))
    
    classification_match = re.search(r'Classification: (.*?)\n', content)
    if classification_match:
        stats['classification'] = classification_match.group(1)
    
    behavior_match = re.search(r'Behavior: (.*?)\n', content)
    if behavior_match:
        stats['behavior'] = behavior_match.group(1)
    
    spawn_match = re.search(r'Spawn: (.*?)\n', content)
    if spawn_match:
        stats['spawn'] = spawn_match.group(1)
    
    # Extract images
    images = {
        'gallery': []
    }
    image_matches = re.findall(r'!\[.*?\]\((.*?)\)', content)
    for img in image_matches:
        if img.endswith('.gif'):
            images['main'] = img
        elif img.endswith('.png'):
            images['gallery'].append(img)
    
    # Extract spawning info
    spawning_match = re.search(r'### 🌎 Spawning\n\n(.*?)\n\n---', content, re.DOTALL)
    spawning = spawning_match.group(1).strip() if spawning_match else ""
    
    # Extract drops
    drops_match = re.search(r'### ⚔️ Drops\n\n(.*?)\n\n---', content, re.DOTALL)
    drops = drops_match.group(1).strip() if drops_match else ""
    
    # Extract behavior
    behavior_match = re.search(r'### 🧠 Behavior\n\n(.*?)\n\n---', content, re.DOTALL)
    behavior = behavior_match.group(1).strip() if behavior_match else ""
    
    # Extract breeding
    breeding_match = re.search(r'### 🥚Breeding\n\n(.*?)\n\n---', content, re.DOTALL)
    breeding = breeding_match.group(1).strip() if breeding_match else ""
    
    return {
        'title': title,
        'last_updated': last_updated,
        'description': description,
        'stats': stats,
        'images': images,
        'spawning': spawning,
        'drops': drops,
        'behavior': behavior,
        'breeding': breeding
    }

def create_yaml_file(animal_folder, en_content, fr_content):
    # Create base structure
    yaml_data = {
        'title': {
            'en': en_content['title'],
            'fr': fr_content['title']
        },
        'last_updated': {
            'en': en_content['last_updated'],
            'fr': fr_content['last_updated']
        },
        'return_link': {
            'en': 'Naturalist Add-On Wiki',
            'fr': 'Wiki de l\'extension Naturalist'
        },
        'return_url': '/www.notion.so/1a7a9a61c3f1800c8e32e893d6e7f430?pvs=21',
        'description': {
            'en': en_content['description'],
            'fr': fr_content['description']
        },
        'stats': {
            'health': en_content['stats'].get('health', 0),
            'classification': {
                'en': en_content['stats'].get('classification', ''),
                'fr': fr_content['stats'].get('classification', '')
            },
            'behavior': {
                'en': en_content['stats'].get('behavior', ''),
                'fr': fr_content['stats'].get('behavior', '')
            },
            'spawn': {
                'en': en_content['stats'].get('spawn', ''),
                'fr': fr_content['stats'].get('spawn', '')
            }
        },
        'images': en_content['images'],
        'spawning': {
            'title': {
                'en': 'Spawning',
                'fr': 'Apparition'
            },
            'description': {
                'en': en_content['spawning'],
                'fr': fr_content['spawning']
            }
        },
        'drops': {
            'title': {
                'en': 'Drops',
                'fr': 'Butin'
            },
            'description': {
                'en': en_content['drops'],
                'fr': fr_content['drops']
            }
        },
        'behavior': {
            'title': {
                'en': 'Behavior',
                'fr': 'Comportement'
            },
            'description': {
                'en': en_content['behavior'],
                'fr': fr_content['behavior']
            }
        },
        'breeding': {
            'title': {
                'en': 'Breeding',
                'fr': 'Reproduction'
            },
            'description': {
                'en': en_content['breeding'],
                'fr': fr_content['breeding']
            }
        },
        'gallery': {
            'title': {
                'en': 'Gallery',
                'fr': 'Galerie'
            }
        },
        'community': {
            'title': {
                'en': 'Have additional questions? Want to be a part of our community?',
                'fr': 'Des questions supplémentaires ? Vous voulez faire partie de notre communauté ?'
            },
            'join': {
                'en': 'Join our Discord!',
                'fr': 'Rejoignez notre Discord !'
            },
            'discord_url': '/discord.com/invite/starfishstudios'
        },
        'social_links': {
            'marketplace': '/www.minecraft.net/en-us/marketplace/creator?name=Starfish%20Studios',
            'curseforge': '/www.curseforge.com/members/starfish_studios/projects',
            'tiktok': '/www.tiktok.com/@starfishstudios',
            'instagram': '/www.instagram.com/starfishstudiosinc/',
            'twitter': '/twitter.com/starfishstudios',
            'youtube': '/www.youtube.com/@starfishstudios',
            'website': '/starfish-studios.com/'
        }
    }
    
    # Write YAML file
    animal_name = os.path.basename(animal_folder)
    yaml_file = os.path.join(animal_folder, f"{animal_name.lower()}.yaml")
    
    with open(yaml_file, 'w', encoding='utf-8') as f:
        yaml.dump(yaml_data, f, allow_unicode=True, sort_keys=False)

def main():
    base_path = Path('Naturalist-Add-On')
    
    # Get all animal folders
    animal_folders = [f for f in base_path.iterdir() if f.is_dir() and not f.name.startswith('.')]
    
    for folder in animal_folders:
        en_file = folder / f"{folder.name}-en.md"
        fr_file = folder / f"{folder.name}-fr.md"
        
        if en_file.exists() and fr_file.exists():
            print(f"Processing {folder.name}...")
            
            # Extract content from markdown files
            en_content = extract_content_from_markdown(en_file)
            fr_content = extract_content_from_markdown(fr_file)
            
            # Create YAML file
            create_yaml_file(str(folder), en_content, fr_content)
            print(f"Created YAML file for {folder.name}")

if __name__ == "__main__":
    main() 