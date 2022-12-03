import click
import json

from src.download_lidar_files import download_lidar_files
from src.download_osm_file import download_osm_file
from src.unzip_and_filter_lidar_files import unzip_and_filter_lidar_files
from src.preprocess_lidar_files import preprocess_lidar_files


@click.command()
@click.argument("border")
@click.option("--shapefile", "-s")
def main(border, shapefile):
    # if shapefile == None:
    #     print("No shapefiles")

    with open(border, "r") as border_file:
        border_coords = json.load(border_file)["features"][0]["geometry"][
            "coordinates"
        ][0][0]

    download_lidar_files(border_coords)
    download_osm_file(border_coords)
    unzip_and_filter_lidar_files(border_coords)
    preprocess_lidar_files(20)


if __name__ == "__main__":
    main()
