import math
import os
import requests

from src.helpers.extract_extrems_from_polygon import extract_extrems_from_polygon
from src.helpers.point_is_inside_polygon import is_inside_polygon


def generate_file_name(x: int, y: int) -> str:
    formatted_x = str(x) if x >= 1000 else f"0{x}"
    formatted_y = str(y) if y >= 1000 else f"0{y}"

    return f"https://wxs.ign.fr/c90xknypoz1flvgojchbphgt/telechargement/prepackage/LIDARHD_PACK_PM_2021$LIDARHD_1-0_LAZ_PM-{formatted_x}_{formatted_y}-2021/file/LIDARHD_1-0_LAZ_PM-{formatted_x}_{formatted_y}-2021.7z"


def round_up_to_odd(number: float) -> float:
    number = math.ceil(number)
    return number + 1 if number % 2 == 0 else number


def ign_tile_is_in_polygon(coord, polygon, tile_size=2):
    x_top_left, y_top_left = coord

    edges = [
        [x * 1000, y * 1000]
        for x in [x_top_left, x_top_left + tile_size]
        for y in [y_top_left, y_top_left - tile_size]
    ]

    for edge in edges:
        if is_inside_polygon(polygon, edge):
            return True

    return False


def download_lidar_files(border_coords: list[list[float]]) -> None:
    [minimum, maximum] = extract_extrems_from_polygon(border_coords)

    x_range = range(
        math.floor(minimum[0] / 2000) * 2, math.floor(maximum[0] / 2000) * 2 + 2, 2
    )

    y_range = range(
        round_up_to_odd(minimum[1] / 1000), round_up_to_odd(maximum[1] / 1000) + 2, 2
    )

    coords = [[x, y] for x in x_range for y in y_range]

    filtered_coords = filter(
        lambda coord: ign_tile_is_in_polygon(coord, border_coords), coords
    )

    file_names = [generate_file_name(*coord) for coord in filtered_coords]

    if not os.path.exists("downloads"):
        os.makedirs("downloads")

    for file_name in file_names:
        short_file_name = file_name.split("/")[-1]
        print(f"Downloading {short_file_name}")

        response = requests.get(file_name, stream=True)

        with open(os.path.join("downloads", short_file_name), "wb") as f:
            f.write(response.content)
