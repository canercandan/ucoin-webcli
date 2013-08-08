var async = require('async');

module.exports = function (node) {
  
  this.lookup = function(req, res){
    node.pks.lookup('', function (err, json) {
      if(err){
        res.send(500, err);
        return;
      }

      res.render('pks', {
        keys: json.keys
      });
    });
  };

  return this;
}