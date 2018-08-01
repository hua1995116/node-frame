const http = require('http');
const url = require('url');
const app = {};
const routes = [];
['get', 'post', 'put', 'delete', 'options', 'all'].forEach((method) => {
    app[method] = (path, fn) => {
        routes.push({method, path, fn});
    }
});

const passRouter = (method, path) => {
    let fn;
    for(let route of routes) {
        if((route.path === path || route.path === '*') && (route.method === method || route.method === 'all')) {
            fn = route.fn;
        }
    }
    if(!fn) {
        fn = (req, res) => {
            res.end(`Cannot ${method} ${path}`);
        }
    }
    return fn;
}

app.listen = (port, host) => {
    http.createServer((req, res) => {
        const method =  req.method.toLocaleLowerCase();
    
        const urlObj = url.parse(req.url, true); // true//后 标记为host
    
        const pathName = urlObj.pathname;
    
        const router = passRouter(method, pathName);
    
        router(req, res);
    }).listen(port, host, ()=> {
        console.log(`Server running at ${host}\:${port}.`);
    });
}

app.get('/', (req, res) => {
    res.end('hello world');
});

app.listen(7788, 'localhost');