import { createWriteStream } from 'fs';
import { Readable } from 'stream';
import { finished } from 'stream/promises';
import { join } from "path";

/**
 * 
 * @param {[number, number][]} tiles 
 */
export async function download(tiles) {
    for (const [x, y] of tiles) {
        const url = `https://storage.sbg.cloud.ovh.net/v1/AUTH_63234f509d6048bca3c9fd7928720ca1/ppk-lidar/PJ/LHD_FXX_${String(x).padStart(4, "0")}_${String(y).padStart(4, "0")}_PTS_C_LAMB93_IGN69.copc.laz`
        const path = join("downloads", `${String(x).padStart(4, "0")}-${String(y).padStart(4, "0")}.laz`);

        console.log(`Fetching ${path}`)

        const res = await fetch(url)

        if (!res.ok || res.body === null) {
            throw new Error("")
        }

        // @ts-ignore
        const body = Readable.fromWeb(res.body);
        await finished(body.pipe(createWriteStream(path)))
    }
}
