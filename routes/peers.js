var async = require('async');
var sha1  = require('sha1');
var fs    = require('fs');
var _     = require('underscore');
var hdc   = require('hdc');

module.exports = function (node, auth) {
  
  this.knownPeers = function(req, res){
    async.waterfall([
      function (next){
        node.ucg.peering.peers.get({ leaves: true }, next);
      },
      function (merkle, next) {
        var peers = [];
        async.forEach(merkle.leaves, function(fingerprint, callback){
          async.waterfall([
            function (next){
              node.ucg.peering.peers.get({ leaf: fingerprint }, next);
            },
            function(json, next){
              var peer = (json.leaf && json.leaf.value) || {};
              peers.push(peer);
              next();
            },
          ], callback);
        }, function (err) {
          next(null, peers);
        });
      }
    ], function (err, peers) {
      if(err){
        res.send(500, err);
        return;
      }

      res.render('peers/stream/all', {
        subtitle: 'Known peers',
        peers: peers || [],
        auth: auth
      });
    });
  };
  
  this.managedKeys = function(req, res){
    async.waterfall([
      function (next){
        node.ucg.peering.keys({ leaves: true}, next);
      },
      function (merkle, next) {
        next(null, merkle.leaves);
      }
    ], function (err, keys) {
      if(err){
        res.send(500, err);
        return;
      }

      res.render('peers/managed', {
        keys: keys || [],
        auth: auth
      });
    });
  };
  
  this.tht = function(req, res){
    async.waterfall([
      function (next){
        node.ucg.tht.get({ leaves: true}, next);
      },
      function (merkle, next) {
        var tht = [];
        async.forEach(merkle.leaves, function(hash, callback){
          async.waterfall([
            function(next){
              node.ucg.tht.get({ leaf: hash }, next);
            },
            function (merkle, next){
              tht.push(merkle.leaf.value.entry);
              next(null);
            },
          ], callback);
        }, function(err){
          next(err, tht);
        });
      }
    ], function (err, tht) {
      if(err){
        res.send(500, err);
        return;
      }

      res.render('peers/tht', {
        tht: tht || [],
        auth: auth
      });
    });
  };
  
  this.upstreamALL = function(req, res){
    async.waterfall([
      function (next){
        node.ucg.peering.peers.upstream.get(next);
      }
    ], function (err, result) {
      if(err){
        res.send(500, err);
        return;
      }

      res.render('peers/stream/streams', {
        subtitle: 'ALL Upstream',
        peers: result.peers || [],
        auth: auth
      });
    });
  };
  
  this.upstreamKEYS = function(req, res){
    async.waterfall([
      function (next){
        node.ucg.peering.keys({ leaves: true }, next);
      },
      function (merkle, next) {
        var keys = {};
        async.forEach(merkle.leaves, function(k, callback){
          node.ucg.peering.peers.upstream.of(k, function (err, json) {
            if(!err && json.peers && json.peers.length > 0)
              keys[k] = json.peers;
            callback();
          });
        }, function(err){
          next(null, keys);
        });
      },
      function (keys, next) {
        var sortedFinal = [];
        var sortedKeys = _(keys).keys();
        sortedKeys.sort();
        sortedKeys.forEach(function (k) {
          sortedFinal.push({ key: k, peers: keys[k] });
        });
        next(null, sortedFinal);
      }
    ], function (err, keys) {
      if(err){
        res.send(500, err);
        return;
      }

      res.render('peers/stream/keys', {
        subtitle: 'Upstreams by key',
        keys: keys || [],
        auth: auth
      });
    });
  };
  
  this.downstreamALL = function(req, res){
    async.waterfall([
      function (next){
        node.ucg.peering.peers.downstream.get(next);
      }
    ], function (err, result) {
      if(err){
        res.send(500, err);
        return;
      }

      res.render('peers/stream/streams', {
        subtitle: 'ALL Downstream',
        peers: result.peers || [],
        auth: auth
      });
    });
  };
  
  this.downstreamKEYS = function(req, res){
    async.waterfall([
      function (next){
        node.ucg.peering.keys({ leaves: true }, next);
      },
      function (merkle, next) {
        var keys = {};
        async.forEach(merkle.leaves, function(k, callback){
          node.ucg.peering.peers.downstream.of(k, function (err, json) {
            if(!err && json.peers && json.peers.length > 0)
              keys[k] = json.peers;
            callback();
          });
        }, function(err){
          next(null, keys);
        });
      },
      function (keys, next) {
        var sortedFinal = [];
        var sortedKeys = _(keys).keys();
        sortedKeys.sort();
        sortedKeys.forEach(function (k) {
          sortedFinal.push({ key: k, peers: keys[k] });
        });
        next(null, sortedFinal);
      }
    ], function (err, keys) {
      if(err){
        res.send(500, err);
        return;
      }

      res.render('peers/stream/keys', {
        subtitle: 'Downstreams by key',
        keys: keys || [],
        auth: auth
      });
    });
  };

  return this;
}
