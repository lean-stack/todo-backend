
// NPM packages
var express     = require('express');
var bodyParser  = require('body-parser');
var tingoEngine = require('tingodb')();

module.exports = function(io) {
  
  // Build an express mountable route handler
  var router = express.Router();
  
  // Open the TingoDB
  var db = new tingoEngine.Db('./data', {});
  
  // middleware specific to this router
  router.use(bodyParser.json());
  router.use(function (req, res, next) {
    req.collection = db.collection('todos');
    next();
  });
  
  // get all
  router.get('/', function(req,res,next) {
    
    req.collection.find({})    
      .toArray(function(err, results){
        
        if (err) { return next(err); }
      
        res.send(results);
      });
  });
  
  // get by id
  router.get('/:id', function(req,res,next) {
    
    req.collection.findOne({_id: req.params.id},
      function(err, result){
        if (err) { return next(err); }
        if( result ) {
          res.send(result);
        } else {
          res.sendStatus(404);
        }
      });
  });
  
  // insert one
  router.post('/', function(req, res, next) {
    
    req.collection.insert(req.body, {}, function(err, result){
      if (err) { return next(err); }
      
      // sending to all clients, include sender
      io.emit('new-todo', result[0]);
      
      res.send(result);
    });
  });
  
  // update one
  router.put('/:id', function(req, res, next) {
    
    req.collection.update(
      {_id: req.params.id}, req.body,
      function(err, count){
        if (err) { return next(err); }
        
        io.emit('update-todo', req.body);
        
        res.send((count===1)?{msg:'success'}:{msg:'error'});
      }); 
    });
  
  // delete one
  router.delete('/:id', function(req, res, next) {
    
    req.collection.remove(
      {_id: req.params.id},
      function(err, count){
        if (err) { return next(err); }
        
        io.emit('delete-todo', req.params.id);
        
        res.send((count===1)?{msg:'success'}:{msg:'error'});
      }); 
    });
    
    return router;
};
