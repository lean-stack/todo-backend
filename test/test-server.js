
// Core modules
var fs = require('fs');

// Assertion library
var expect = require('chai').expect;

// AJAX library
var superagent = require('superagent');

// Backend App (actually starts the server!)
var server = require('../server');
var serverUrl = 'http://localhost:3000';
var apiUrl = 'http://localhost:3000/api';

// Socket.io 
var options ={
  transports: ['websocket'],
  'force new connection': true
};
var io = require('socket.io-client');

describe('HTTP API - CRUD operations:', function(){
  
  before(function(done) {
    
      fs.unlink('data/todos', function(err){
        done();
      });      
  });
  
  // Todo-Id for the newly inserted todo item
  var id;
  
  it('GET /resource shoud return an empty array on a new resource',
    function(done){
      superagent.get(apiUrl)
        .end(function(e, res){
          expect(e).to.eql(null);
          expect(res.body).to.have.length(0);
          done();
      });
    }
  );
  
  it('POST should insert a new object', function(done){
    superagent.post(apiUrl)
      .send(
        { 
          txt: 'Unit Testing',
          completed: false
        }
      )
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.body).to.have.length(1);
        expect(res.body[0]._id).to.be.above(0);
        expect(res.body[0].txt).to.equal('Unit Testing');
        id = res.body[0]._id;
        done();
      });
  });
  
  it('GET /resource should return two objects after inserting a second object', function(done){
    superagent.post(apiUrl)
      .send(
        { 
          txt: 'E2E Testing',
          completed: false
        }
      )
      .end(function(){
        superagent.get(apiUrl)
          .end(function(e, res){
            expect(e).to.eql(null);
            expect(res.body).to.have.length(2);
            done();
        });
      });
  });
  
  it('GET /resource/{id} should return the first object',   function(done){
    superagent.get(apiUrl+'/'+id)
      .end(function(e, res){
          expect(e).to.eql(null);
          expect(res.body._id).to.equal(id);
          done();
      });
  });
  
  it('PUT should modify an object', function(done){
    superagent.put(apiUrl+'/'+id)
      .send(
        { 
          completed: true
        }
      )
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.body.msg).to.equal('success');
        superagent.get(apiUrl+'/'+id)
          .end(function(e, res){
            expect(e).to.eql(null);
            expect(res.body.completed).to.equal(true);
            done();
          });
      });
  });
  
  it('DELETE should remove an object', function(done){
    superagent.del(apiUrl+'/'+id)
      .end(function(e,res){
        expect(e).to.eql(null);
        expect(res.body.msg).to.equal('success');
        superagent.get(apiUrl)
          .end(function(e, res){
            expect(e).to.eql(null);
            expect(res.body).to.have.length(1);
            done();
          });
      });
  });

  it('GET /resource/{id} should return 404 for wrong id',   function(done){
    superagent.get(apiUrl+'/'+id)
      .end(function(e, res){
          //expect(e).to.eql(null);
          expect(res.statusCode).to.equal(404);
          done();
      });
  });
  
});

describe('WebSocket functionality:', function(){
  
    // Todo-Id for the newly inserted todo item
  var id;
  
  it('should receive a message when new item posted', function(done){
    
    var client = io.connect(serverUrl, options);
    
    client.once("connect", function () {
        client.once("new-todo", function (message) {
            
            expect(message.txt).to.eql('Web Sockets')
            id = message._id; // save the id for later
            
            client.disconnect();
            done();
        });
    });
    
    superagent.post(apiUrl)
      .send(
        { 
          txt: 'Web Sockets',
          completed: false
        }
      )
      .end(function(e,res){
        expect(e).to.eql(null);
       
      });
        
  });
  
  it('should receive a message when item is updated', function(done){
    
    var client = io.connect(serverUrl, options);
    
    client.once("connect", function () {
        client.once("update-todo", function (message) {
            
            expect(message.completed).to.eql(true)

            client.disconnect();
            done();
        });
    });
    
    superagent.put(apiUrl+'/'+id)
      .send(
        { 
          completed: true
        }
      )
      .end(function(e,res){
        expect(e).to.eql(null);
      });
        
  });

  it('should receive a message when item is deleted', function(done){
    
    var client = io.connect(serverUrl, options);
    
    client.once("connect", function () {
        client.once("delete-todo", function (message) {
            
            expect(parseInt(message)).to.eql(id);

            client.disconnect();
            done();
        });
    });
    
    superagent.del(apiUrl+'/'+id)
      .send()
      .end(function(e,res){
        expect(e).to.eql(null);
      });
        
  });

});

