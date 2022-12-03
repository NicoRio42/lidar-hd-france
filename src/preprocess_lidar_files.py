import subprocess
import os


def preprocess_lidar_files(thining_factor=20):
    las_dir = os.path.join("temp", "las")
    thin_dir = os.path.join("temp", "thin")
    ground_dir = "ground"

    if not os.path.exists(thin_dir):
        os.makedirs(thin_dir)

    if not os.path.exists(ground_dir):
        os.makedirs(ground_dir)

    for las_file in os.listdir(las_dir):
        file_name, file_extension = os.path.splitext(las_file)

        print(f"Thinning {las_file}")

        subprocess.run(
            [
                "las2las64",
                "-i",
                os.path.join(las_dir, las_file),
                "-o",
                os.path.join(thin_dir, f"{file_name}_thin.{file_extension}"),
                "-keep_every_nth",
                str(thining_factor),
            ]
        )

        print(f"Classifying ground points for {las_file}")

        subprocess.run(
            [
                "lasground64",
                "-i",
                os.path.join(thin_dir, f"{file_name}_thin.{file_extension}"),
                "-o",
                os.path.join(ground_dir, f"{file_name}_ground.{file_extension}"),
            ]
        )
