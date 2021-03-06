var http = require("http"),
	url = require("url"),
	path = require("path"),
	fs = require("fs"),
	sqlite3 = require('sqlite3').verbose();

var port = process.argv[2] || 8888;
var filename = path.join(process.cwd(), "/index.html");

var db_file = "db/byteball.sqlite";
var db = new sqlite3.Database(db_file);

http.createServer(function(request, response) {
	fs.readFile(filename, "binary", function(err, file) {
		if(err) {        
			response.writeHead(500, {"Content-Type": "text/plain"});
			response.write(err + "\n");
			response.end();
			return;
		}
		response.writeHead(200, {"Content-Type": "text/html"});
		response.write(file, "binary");

		db.all(
			"SELECT 'tx' AS type, byteball_address, bitcoin_address, balance, 0 AS bytes, txid AS tx_sig, creation_date, printf('%.4f', share*100) AS share \
			FROM proof_transactions WHERE is_active=1 AND count_confirmations>0 \
			UNION \
			SELECT 'signature' AS type, byteball_address, bitcoin_address, balance, 0 AS bytes, signature AS tx_sig, creation_date, printf('%.4f', share*100) AS share \
			FROM signed_messages WHERE is_active=1 \
			ORDER BY creation_date DESC", 
			function(err, rows) {
				if (err){
					response.write('exception');
					response.end();
					throw Error(err);
				}
				var sum_btc = 0;
				for (var i in rows) {
					sum_btc += rows[i].balance;
				}
				response.write('<script type="text/javascript"> var dataJSON = ' + JSON.stringify(rows) + '; var btc_sum = ' + sum_btc + ';</script>');
				response.write('</body></html>');
				response.end();
			}
		);
	});
}).listen(parseInt(port, 10));

console.log("server running at\n  => localhost:" + port + "/\nCTRL + C to shutdown");