import { createServer } from 'http';
import { readFile, writeFile } from 'fs/promises';
import crypto from 'crypto';
import path from 'path';

const PORT = process.env.PORT || 3000;
const dataFile = path.join("data", "links.json");

/*
const server = createServer(async (req, res) => {

    if (req.method === 'GET') {
        if (req.url === '/') {
            try {
                const data = await readFile(path.join("public", "index.html"));
                res.writeHead(200, { 'Content-Type': "text/html" });
                //res.write(data);
                //res.end();
                res.end(data);
            } catch (e) {
                res.writeHead(404, { 'Content-Type': "text/html" });
                res.end("404 page not found");
            }
        } else if (req.url === '/style.css') {
            try {
                const data = await readFile(path.join("public", "style.css"));
                res.writeHead(200, { 'Content-Type': "text/css" });
                //res.write(data);
                //res.end();
                res.end(data);
            } catch (e) {
                res.writeHead(404, { 'Content-Type': "text/html" });
                res.end("404 page not found");
            }
        }
    }
});
*/



const serveFile = async (res, filePath, contentType) => {
    try {
        const data = await readFile(filePath);
        res.writeHead(200, { 'Content-Type': contentType });
        //res.write(data);
        //res.end();
        res.end(data);
    } catch (e) {
        res.writeHead(404, { 'Content-Type': contentType });
        res.end("404 page not found");
    }
}

const saveLinks = async (links) => {
    await writeFile(dataFile, JSON.stringify(links));
}

const loadLinks = async () => {
    try {
        const links = await readFile(dataFile);
        return JSON.parse(links);
    } catch (e) {
        if (e.code === 'ENOENT') { // error no entry
            await writeFile(dataFile, JSON.stringify({}));
        }
        return {};
    }
}

const server = createServer(async (req, res) => {
    if (req.method === 'GET') {
        if (req.url === '/') {
            serveFile(res, path.join("public", "index.html"), "text/html");
        } else if (req.url === '/style.css') {
            serveFile(res, (path.join("public", "style.css")), "text/css");
        }else if(req.url==='/links'){
            const links=await loadLinks();
            res.writeHead(200,{'Content-Type':'application/json'});
            res.end(JSON.stringify(links));
        }else{
            const links=await loadLinks();
            const shortCode=req.url.slice(1);
            if(links[shortCode]){
                res.writeHead(302,{location:links[shortCode]});
                return res.end();
            }
        }
    }

    if (req.method === 'POST' && req.url === '/shorten') {

        const links = await loadLinks();

        let body = "";
        req.on('data', (chunk) => body += chunk);
        req.on('end', async () => {
            console.log(body);
            const { url, shortCode } = JSON.parse(body);
            const finalShortCode = shortCode || crypto.randomBytes(4).toString('hex');
            if (!url) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end("URL is required");
            } else if (links[finalShortCode]) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end("Short code is alredy exists");
            } else {
                links[finalShortCode] = url;
                await saveLinks(links);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, shortCode: finalShortCode }));
            }
        })
    }
})

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
});