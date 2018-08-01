const http = require('http');
const url = require('url');
const path = require('path');
const fs = require('fs');
const app = {};
const routes = [];
['get', 'post', 'put', 'delete', 'options', 'all', 'use'].forEach((method) => {
    app[method] = (path, fn) => {
        routes.push({
            method,
            path,
            fn
        });
    }
});

const lazy = function* (arr) {
    yield* arr;
}

//转换模式为相应正则表达式
const replaceParams = (path) => new RegExp(`\^${path.replace(/:\w[^\/]+/g, '\\w[^\/]+')}\$`);

const passRouter = (routes, method, path) => (req, res) => {
    const lazyoutes = lazy(routes);
    (function next() {
        const it = lazyoutes.next().value;
        if (!it) {
            res.end(`Cannot ${method} ${path}`);
            return;
        } else if (it.method === 'use' && (it.path === '/' || it.path === path || path.startsWith(it.path.concat('/')))) {
            it.fn(req, res, next);
        } else if ((it.method === method || it.method === 'all') && (it.path === path || it.path === '*')) {
            it.fn(req, res);
        } else if (it.path.includes(':') && (it.method === method || it.method === 'all') && (replaceParams(it.path).test(path))) {
            //匹配成功时逻辑
            let index = 0;
            //分割路由
            const param2Array = it.path.split('/');
            //分割请求路径
            const path2Array = path.split('/');
            const params = {};
            param2Array.forEach((path) => {
                if (/\:/.test(path)) {
                    //如果是模式匹配的路径，就添加入params对象中
                    params[path.slice(1)] = path2Array[index]
                }
                index++
            })
            req.params = params
            it.fn(req, res);
        } else {
            next();
        }
    })();
}

//常用的静态文件格式
const mime = {
    "html": "text/html",
    "css": "text/css",
    "js": "text/javascript",
    "json": "application/json",
    "gif": "image/gif",
    "ico": "image/x-icon",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png"
}
//处理静态文件
function handleStatic(res, pathname, ext) {
    fs.exists(pathname, (exists) => {
        if (!exists) {
            res.writeHead(404, {
                'Content-Type': 'text/plain'
            })
            res.write('The request url' + pathname + 'was not found on this server')
            res.end()
        } else {
            fs.readFile(pathname, (err, file) => {
                if (err) {
                    res.writeHead(500, {
                        'Content-Type': 'text/plain'
                    })
                    res.end(err)
                } else {
                    const contentType = mime[ext] || 'text/plain'
                    res.writeHead(200, {
                        'Content-Type': contentType
                    })
                    res.write(file)
                    res.end()
                }
            })
        }
    })
}

let _static = 'static' //默认静态文件夹位置
//更改静态文件夹的函数
app.setStatic = (path) => {
  _static = path;
};

app.listen = (port, host) => {
    http.createServer((req, res) => {
        const method = req.method.toLocaleLowerCase();

        const urlObj = url.parse(req.url, true); // true//后 标记为host

        const pathName = urlObj.pathname;
        //获取后缀
        const ext = path.extname(pathName).slice(1)
        //如果有后缀，则是静态文件
        if(ext) {
            handleStatic(res, _static + pathName, ext)
        } else {
            passRouter(routes, method, pathName)(req, res);
        }
        

    }).listen(port, host, () => {
        console.log(`Server running at ${host}\:${port}.`);
    });
}

app.use('/use', (req, res, next) => {
    console.log(111);
    next();
})

app.get('/use', (req, res) => {
    res.end('hello world');
});

app.listen(7788, 'localhost');