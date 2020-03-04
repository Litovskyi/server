var express            = require('express');
var app                = express();
var path               = require('path');
var favicon            = require('serve-favicon');
var log                = require('./lib/log') (module);
var port               = 1337;
var config             = require('./lib/config.js');
var ArticleModel       = require('./lib/mongoose.js').ArticleModel;

app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
	res.status(404);
	log.debug('Not found URL: %s', req.url);
	res.send({error: 'Not found'});
});

app.use((err, req, res, next) => {
	res.status(err.status || 500);
	log.error('Internal error(%d)', res.statusCode, err.message);
	res.send({error: err.message});
});

app.get('/ErrorExample', (req, res, next) => {
	next(new Error('Random error!'));
});

app.get('/api', (req, res) => {
	res.send('Api is running');
});

app.listen(port, () => {
	console.log(`Express server listening on port ${port}`);
});

app.listen(config.get('port'), () => {
	log.info('Express server listening on port ' + config.get('port'));
});

app.get('/api/articles', (req, res) => {
    return ArticleModel.find( (err, articles) => {
        if (!err) {

            return res.send(articles);
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode,err.message);

            return res.send({ error: 'Server error' });
        }
    });
});

app.post('/api/articles', (req, res) => {
    var article = new ArticleModel({
        title: req.body.title,
        author: req.body.author,
        description: req.body.description,
        images: req.body.images
	});

article.save( err => {
    if (!err) {
        log.info("article created");

        return res.send({ status: 'OK', article:article });
    } 
    else {
        console.log(err);
        if(err.name == 'ValidationError') {
            res.statusCode = 400;
            res.send({ error: 'Validation error' });
        } else {
            res.statusCode = 500;
            res.send({ error: 'Server error' });
        }
        	log.error('Internal error(%d): %s', res.statusCode,err.message);
        }
    });
});

app.get('/api/articles/:id', (req, res) => {
    return ArticleModel.findById(req.params.id,  (err, article) => {
        if(!article) {
            res.statusCode = 404;

            return res.send({ error: 'Not found' });
        }
        if (!err) {

            return res.send({ status: 'OK', article:article });
        } else {
            res.statusCode = 500;
            log.error('Internal error(%d): %s', res.statusCode,err.message);

            return res.send({ error: 'Server error' });
        }
    });
});

app.put('/api/articles/:id',  (req, res) => {
    return ArticleModel.findById(req.params.id,  (err, article) => {
        if(!article) {
            res.statusCode = 404;

            return res.send({ error: 'Not found' });
        }

        article.title = req.body.title;
        article.description = req.body.description;
        article.author = req.body.author;
        article.images = req.body.images;

        return article.save(function (err) {
            if (!err) {
                log.info("article updated");

                return res.send({ status: 'OK', article:article });
            } else {
                if(err.name == 'ValidationError') {
                    res.statusCode = 400;
                    res.send({ error: 'Validation error' });
                } else {
                    res.statusCode = 500;
                    res.send({ error: 'Server error' });
                }
                log.error('Internal error(%d): %s', res.statusCode,err.message);
            }
        });
    });
});

app.delete('/api/articles/:id', (req, res) => {

    return ArticleModel.findById(req.params.id, (err, article) => {
        if(!article) {
            res.statusCode = 404;

            return res.send({ error: 'Not found' });
        }
        return article.remove( err => {
            if (!err) {
                log.info("article removed");

                return res.send({ status: 'OK' });
            } else {
                res.statusCode = 500;
                log.error('Internal error(%d): %s', res.statusCode,err.message);

                return res.send({ error: 'Server error' });
            }
        });
    });
});