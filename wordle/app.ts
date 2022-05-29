import * as express from 'express';
import { AddressInfo } from "net";
import * as path from 'path';

import routes from './routes/index';

const debug = require('debug')('my express app');
const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

app.use((_req, _res, next) => {
    const err = new Error('Not Found');
    next(err);
});

if (app.get('env') === 'development') {
    app.use((err: any, _req: any, res: any, _next: any) => {
        res.status(err['status'] || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}


app.use((err: any, _req: any, res: any, _next: any) => {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.set('port', process.env["PORT"] || 3000);

const server = app.listen(app.get('port'), function () {
    debug(`Express server listening on port ${ (server.address() as AddressInfo).port }`);
});