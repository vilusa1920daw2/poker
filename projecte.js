const express = require('express');
const app = express();
var bodyParser = require('body-parser');
var jug = [];
var fs = require('fs');
var http = require('http');
 
const jwt = require("jsonwebtoken");
var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;
app.use(bodyParser.json());


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
class Usuari {
    constructor(codiU, codiP, cartes) {
        this.codiU = codiU;
        this.codiP = codiP;
        this.cartes = [];
        this.aposta = null;
        this.victorias = 0;
        this.passat = false;
    }
    addCarta(carta) {
        
        this.cartes.push(carta);
    }
    apostar(d) {
        if(this.aposta==null){
            this.aposta=d;
        }else{
            this.aposta = this.aposta + d;
        }
    }
    ganar() {
        this.victorias++;
    }
    toString(){
        return this.codiU;
    }
}
var cartes = [];
var codiP=0;
var ganador=null;
for (i = 1; i <= 4; i++) {
    for (j = 1; j <= 13; j++) {
        var carta = { palo: i, valor: j };
        cartes.push(carta);
    }
}
app.get('/', function(request, response){
    fs.readFile('./public/poker.html', function (err, html) {
        if (err) {
            throw err; 
        }       
        response.write(html);  
        response.end();  
    });
    
});
app.post('/iniciarJoc/:codiPartida/:u', (req, res) => {
    
    cartes = [];
    codiP = req.params.codiPartida;
    console.log(codiP);
    for (i = 1; i <= 4; i++) {
        for (j = 1; j <= 13; j++) {
            var carta = { palo: i, valor: j };
            cartes.push(carta);
        }
    }
    var U = jug.find(a => a.codiU == req.params.u && a.codiP == req.params.codiPartida);
    if (!U){
        U = new Usuari(req.params.u, codiP);jug.push(U);
    }
    
    
    var jugPartida=jug.filter(a => a.codiP==codiP);
    const token = jwt.sign({
        sub: codiP,
        usuari: req.params.u
    }, "clau", { expiresIn: "3 hours" });
    res.send("Partida iniciada amb codi: "+codiP+"</br>Usuarios en partida: "+jugPartida.toString()+"</br>Token: "+token);
    

});

app.get('/api/cartes', (req, res) => res.send(cartes));

app.get('/obtenirCarta/:codiP/:u', (req, res) => {

    var jugador = jug.find(a => a.codiU == req.params.u && a.codiP == req.params.codiP);
    var m = 0
    while (m < 1) {
        var r1 = Math.floor(Math.random() * 4) + 1;
        var r2 = Math.floor(Math.random() * 12) + 1;

        cartes.forEach(function (c, index) {
            if (c.palo === r1 && c.valor === r2) {
                var d1 = { palo: r1, valor: r2 };
                jugador.addCarta(d1);
                cartes.splice(index, 1);
                m++;
            }
            index--;

        });

    }

   

    res.send("Carta repartida per a: " + req.params.u);


});

app.get('/mostrarCartes/:codiP/:u', (req, res) => {
    var jugador = jug.find(a => a.codiU == req.params.u && a.codiP == req.params.codiP);
    if (!jugador) res.status(404, 'error');

    res.send(jugador.cartes);
});

app.put('/tirarCarta/:codiP/:u/:ca', (req, res) => {
    
    var jugador = jug.find(a => a.codiU == req.params.u && a.codiP == req.params.codiP);
    var tira = req.params.ca.split(",");
    for (var i = 0; i < tira.length; i) {

        var r1 = Math.floor(Math.random() * 4) + 1;
        var r2 = Math.floor(Math.random() * 12) + 1;

        cartes.forEach(function (c, index) {
            if (c.palo === r1 && c.valor === r2) {
                var d1 = { palo: r1, valor: r2 };
                jugador.cartes[tira[i] - 1] = d1;

                cartes.splice(index, 1);
                i++;
            }
            index--;

        });

    }

});

app.put('/apostar/:codiP/:u/:d', (req, res) => {


    var jugador = jug.find(a => a.codiP == req.params.codiP && a.codiU == req.params.u);
    if (!jugador.passat) {
        jugador.apostar(req.params.d);
    }
    



     res.send(jugador.toString()+" ha apostado "+jugador.aposta+" euros");
});

app.put('/apostar/:codiP/:u/passar', (req, res) => {


    var jugador = jug.find(a => a.codiP == req.params.codiP && a.codiU == req.params.u);
    jugador.passat = true;
     res.send("El jugador "+jugador.toString()+" ha passat");

});

app.delete('/acabarPartida/:codiP', (req, res) => {
    var filtrats = jug.filter(a => a.codiP == req.params.codiP && !a.passat);
    

    jug.forEach(function (p) {

        

            jug.forEach(function (p2, index) {

                if (p2.codiP == req.params.codiP) jug.splice(index, 1);
                index--;

            });
        

    });
    if(ganador==null){
    if ((filtrats.filter(a => a.aposta == null)).length == 0) {
        if (filtrats.length == 1) {
            filtrats[0].ganar();
            ganador= filtrats[0].codiU;
            
        }
        else {
            var ganadorIndex = Math.floor(Math.random() * filtrats.length);
            filtrats[ganadorIndex].ganar();
            ganador=filtrats[ganadorIndex].codiU;
            
        }};
    }
    res.send("Ganador: " + ganador + "\nPartida acabada: ");
});

app.listen(3000, () => console.log('inici servidor'));