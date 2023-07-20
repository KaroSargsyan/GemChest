import os
import json
from pathlib import Path
from dotenv import load_dotenv
import json
import requests
import glob


load_dotenv()
metadatas={}



    # write_metadata()

# def write_metadata():
    # dir_lenght=len(os.listdir("metadata/metadata_json"))+1
    # for id in range(1,dir_lenght):
    #     f1=open(f"metadata/metadata_json/{id}.json","r") 
    #     f2=open(f"metadata/metadata_json/{id}_temp.json","w") 
    #     data=json.load(f1)
    #     metadata_file_name = f"./metadata/rinkeby/{id}.json"
    #     if Path(metadata_file_name).exists():
    #         print("{} already found, delete it to overwrite!".format(metadata_file_name))
    #     else:
    #         print("Creating Metadata file: " + metadata_file_name)
    #         image_to_upload = None
    #         if os.getenv("UPLOAD_IPFS") == "true":
    #             image_path = "./img/{}.png".format(id)
    #             image_to_upload = upload_to_ipfs(image_path,id)
    #         data["image"] = image_to_upload
    #         json.dump(data,f2,indent=2)
    #         with open(metadata_file_name, "w") as file:
    #             json.dump(data, file,indent=1)
    #         if os.getenv("UPLOAD_IPFS") == "true":
    #             upload_to_ipfs(metadata_file_name,id)
    #     f1.close();f2.close()
    #     os.rename(f"metadata/metadata_json/{id}_temp.json",f"metadata/metadata_json/{id}.json")
        

# def upload_to_ipfs(filepath, token_number):

#         pinata_hash = uploadToPinata(filepath)
#         print(pinata_hash)

       
#         filename = filepath.split("/")[-1:][0]

#         image_uri = "https://ipfs.io/ipfs/{}?filename={}".format(pinata_hash, filename)

#         if image_uri.endswith('json'):
#             metadatas[token_number]=f"{image_uri}"
#             with open("metadata/meta.json",'w') as file:
#                 json.dump(metadatas,file,indent=1)

#         return image_uri


def uploadToPinata(filepath):
    PINATA_BASE_URL = 'https://api.pinata.cloud/'
    endpoint = 'pinning/pinFileToIPFS'
    print(filepath.split('/')[-1:][0])

    filename = filepath.split('/')[-1:][0]
    headers = {'pinata_api_key':"906d0ca09f18995a9094" ,
            'pinata_secret_api_key':"5b8fc3496503deba6f412ab241d653b13b0ed5ef85cb7c227639baf949466fe8"}
    with Path(filepath).open("rb") as fp:
        image_binary = fp.read()
        response = requests.post(PINATA_BASE_URL + endpoint,
                                files={"file": (filename, image_binary)},
                                headers=headers)
        data = response.json()                       
        print(data['IpfsHash'])
        return data['IpfsHash']


uploadToPinata("chest1.png")




