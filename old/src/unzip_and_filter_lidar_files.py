import os
import shutil
from src.download_lidar_files import ign_tile_is_in_polygon
import py7zr


def unzip_and_filter_lidar_files(border_coords: list[list[float]]):
    if not os.path.exists("temp"):
        os.makedirs("temp")

    unzipped_dir = os.path.join("temp", "unzipped")
    las_dir = os.path.join("temp", "las")

    if not os.path.exists(unzipped_dir):
        os.makedirs(unzipped_dir)

    if not os.path.exists(las_dir):
        os.makedirs(las_dir)

    for zipped_file in os.listdir("downloads"):
        with py7zr.SevenZipFile(os.path.join("downloads", zipped_file), mode="r") as z:
            z.extractall(unzipped_dir)

        file_name, file_extension = os.path.splitext(zipped_file)

        for las_file in os.listdir(os.path.join(unzipped_dir, file_name)):
            splited_file_name = las_file.split("_")
            coords = [int(splited_file_name[2]), int(splited_file_name[3])]

            if ign_tile_is_in_polygon(coords, border_coords, 1):
                shutil.move(os.path.join(unzipped_dir, file_name, las_file), las_dir)
