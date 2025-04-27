import os
import yaml
import glob

def clean_yaml_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as file:
        try:
            data = yaml.safe_load(file)
        except yaml.YAMLError as e:
            print(f"Error parsing {file_path}: {e}")
            return

    # Process last_updated
    if 'last_updated' in data and isinstance(data['last_updated'], dict):
        # Take the English value or the first value
        if 'en' in data['last_updated']:
            data['last_updated'] = data['last_updated']['en']
        else:
            data['last_updated'] = list(data['last_updated'].values())[0]

    # Delete return_link
    if 'return_link' in data:
        del data['return_link']

    # Delete return_url if it exists
    if 'return_url' in data:
        del data['return_url']

    # Remove title from spawning but keep description
    if 'spawning' in data and isinstance(data['spawning'], dict):
        if 'title' in data['spawning']:
            del data['spawning']['title']

    # Remove title from drops but keep description
    if 'drops' in data and isinstance(data['drops'], dict):
        if 'title' in data['drops']:
            del data['drops']['title']

    # Remove title from behavior but keep description
    if 'behavior' in data and isinstance(data['behavior'], dict):
        if 'title' in data['behavior']:
            del data['behavior']['title']

    if 'breeding' in data and isinstance(data['behavior'], dict):
        if 'title' in data['breeding']:
            del data['breeding']['title']

    # Remove title from gallery but keep the rest
    if 'gallery' in data and isinstance(data['gallery'], dict):
        del data['gallery']

    if 'social_links' in data and isinstance(data['social_links'], dict):
        del data['social_links']

    if 'community' in data and isinstance(data['community'], dict):
        del data['community']

    # Save the cleaned data back to the file
    with open(file_path, 'w', encoding='utf-8') as file:
        yaml.dump(data, file, allow_unicode=True, sort_keys=False)

def process_animal_files(animal_dir):
    # Get all animal YAML files
    yaml_files = glob.glob(os.path.join(animal_dir, 'a_*', '*.yaml'))
    for file_path in yaml_files:
        print(f"Processing {file_path}")
        clean_yaml_file(file_path)

if __name__ == "__main__":
    # Point this to your Naturalist-Add-On/animal/ directory
    animal_directory = "animal/"
    process_animal_files(animal_directory)
    print("YAML cleaning completed.")