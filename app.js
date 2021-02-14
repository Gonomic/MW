const https = require('https');
const fs = require('fs');
const expr= require('express');
const jwt = require('jsonwebtoken');
const mysql = require('mysql');
const cors = require('cors');

const port = 3001
const app = expr()

app.use(cors());
app.options('*', cors());


const credentials = {
  key: fs.readFileSync('./IN/server.key'),
  cert: fs.readFileSync('./IN/__dekknet_com.crt')
};


// app.options('*', cors());

// var corsOptions = {
//   origin: [
//     'https://dekknet.com', 
//     'https://dhofoliofe.dekknet.com',
//     'https://dhofoliomw.dekknet.com',
//     'https://192.168.1.10:666',
//     'https://192.168.1.2:666',
//     'https://192.168.1.11:1001',
//     'https://localhost:1001'
//   ] 
// }



// app.use(cors(corsOptions));

//TODO: Onderstaande gegevens nog te vervangen door de juiste (productie) gegevens FDE 21-11-2020
const DHOFOLIOpool = mysql.createPool({
  connectionLimit: 10, 
  password: '97qjLGIuAzHtA520lEAu+)_', 
  user: 'root',
  database: 'DHOFOLIO',
  host: '192.168.1.2',
  port: '3308' 
});
 

// Deze functie krijgt de naam van een Sproc en parameters en stuurt deze naar de database om de gegevens uit de database te halen
DHOFOLIOGetDBDataWithParms = (MySqlSPROCNameIn, MySqlSPROCParmNameIn) => {
  console.log('In function DHOFOLIOGetDBDataWithParms, params are: MySqlSPROCNameIN= ' + MySqlSPROCNameIn + " and MySqlSPROCParmNameIN= " + MySqlSPROCParmNameIn);
  console.log('In function DHOFOLIOGetDBDataWithParms, Result of isNaN on MySqlSPROCParmNameIn: ' + isNaN(MySqlSPROCParmNameIn));
  return new Promise( (resolve, reject) => {
    if (isNaN(MySqlSPROCParmNameIn)) {
      console.log("In function DHOFOLIOGetDBDataWithParms, MySqlSPROCParmNameIn is NOT a number!");
      DHOFOLIOpool.query('CALL ' + MySqlSPROCNameIn + '("' + MySqlSPROCParmNameIn +'")', (err, results) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(results);
        }
      });
    } else {
      console.log("In function DHOFOLIOGetDBDataWithParms, MySqlSPROCParmNameIn is A number!");
      DHOFOLIOpool.query('CALL ' + MySqlSPROCNameIn + '(' + MySqlSPROCParmNameIn +')', (err, results) => {
        if (err) {
          return reject(err);
        } else {
          return resolve(results);
        }
      });
    };
  });
};

// Deze functie krijgt de naam van een Sproc en 2 parameters en stuurt deze naar de database om de gegevens uit de database te halen
DHOFOLIOGetDBDataWithParms2 = (MySqlSPROCNameIn, MySqlSPROCParmNameIn1, MySqlSPROCParmNameIn2) => {
  console.log('In function DHOFOLIOGetDBDataWithParms2, params are: MySqlSPROCNameIN= ' + MySqlSPROCNameIn + " and MySqlSPROCParmNameIN1= " + MySqlSPROCParmNameIn1 + " and MySqlSPROCParmNameIN2= " + MySqlSPROCParmNameIn2);
  return new Promise( (resolve, reject) => {
    DHOFOLIOpool.query('CALL ' + MySqlSPROCNameIn + '(' + MySqlSPROCParmNameIn1 + ',' + MySqlSPROCParmNameIn2 + ')', (err, results) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(results);
      }
    });
  });
};


// Deze functie krijgt de naam van een Sproc en stuurt deze naar de database om de gegevens uit de database te halen
DHOFOLIOGetDBDataWithoutParms = (MySqlSPROCNameIn) => {
  console.log('In function DHOFOLIOGetDBDataWithoutParms, Sproc= ' + MySqlSPROCNameIn);
  return new Promise( (resolve, reject) => {
    DHOFOLIOpool.query('CALL ' + MySqlSPROCNameIn, (err, results) => {
      if (err) {
        return reject(err);
      } else {
        return resolve(results);
      }
    });
  });
};


// Root van de API
app.get('/', (req, res) => {
  console.log('In app.get. Url= /');
  // console.log("Request headers are: " + req.rawHeaders);

  res.json({
    Message: 'API for DHO-FOLIO application!',
    DateAndTime: Date.now()
  });
});

// Deze functie vangt een POST request met URL /api/sproc op waarna functie DHOFOLIOGetDBData met de naam van de sproc
// als parameter uitgevoerd wordt om de gegevens uit de database te halen. De functie verifyToken wordt gebruikt om 
// deze url middels een token te beschermen  tegen onbedoelde toegang. Deze code is bedoeld om calls voor Sprocs zonder 
// parameter af te handelen.
// --------------------------------------------
app.get('/api/sproc/:SprocNameIn', verifyToken, (req, res) => {
  console.log('In app.get. Url= /api/sproc/' + req.params.SprocNameIn);
  // console.log("Request headers are: " + req.rawHeaders);
  jwt.verify(req.token, '<TheSecretKey>', (err, authData) => {
    if (err) {
       console.log('In app.get. Url= /api/sproc/' + req.params.SprocNameIn + ". Status= Forbidden (403)");
      res.sendStatus(403);
     
    } else {
      DHOFOLIOGetDBDataWithoutParms(req.params.SprocNameIn)
      .then((value) => {
          res.json({
            // message: 'Post created....',
            // authData: authData,
            Databack: value
          });
          console.log('In app.get. Url= /api/sproc/' + req.params.SprocNameIn + ". Status= Data send back to requestor (200)");
      })
      .catch(err => {
          // Return default code for HTTP "Internal server error" (=500) 
          res.sendStatus(404);
          console.log('In app.get. Url= /api/sproc/' + req.params.SprocNameIn + ". Error= " + JSON.stringify(err) + ", translated to HTTP error 500 (Internal server error)");
      });
    }
  });
});


// Deze functie vangt een POST request met URL /api/sproc op en haalt de naam van de sproc uit parameter :SprocNameIn
// en de waarde van de parameter van deze Sproc uit :SprocParmIn van de url waarna functie DHOFOLIOGetDBData met de naam 
// van de sproc en de parameter van de Sproc als parameter uitgevoerd wordt om de gegevens uit de database te halen. 
// De functie verifyToken wordt gebruikt om deze url middels een token te beschermen tegen onbedoelde toegang.
// Deze code is bedoeld om calls voor Sprocs met parameter af te handelen.
// --------------------------------------------
// app.get('/api/sproc/:SprocNameIn/:SprocParmIn', verifyToken, (req, res) => {
  app.get('/api/sproc/:SprocNameIn/:SprocParmIn', (req, res) => {
  console.log('In app.get. Url= /api/sproc/' + req.params.SprocNameIn + '/' + req.params.SprocParmIn);
  // console.log("Request headers are: " + req.rawHeaders);
  // jwt.verify(req.token, '<TheSecretKey>', (err, authData) => {
  //   if (err) {
  //     res.sendStatus(403);
  //     console.log('In app.get. Url= /api/sproc/' + req.params.SprocNameIn + ". Status= Forbidden (403)");
  //   } else {
      DHOFOLIOGetDBDataWithParms(req.params.SprocNameIn, req.params.SprocParmIn)
      .then((value) => {
          res.json(
            // message: 'Post created....',
            // authData: authData,
            value
          );

          // res.json({
          //   // message: 'Post created....',
          //   // authData: authData,
          //   Databack: value
          // });


          console.log('In app.get. Url= /api/sproc/' + req.params.SprocNameIn + ". Status= Data send back to requestor (200). Data=" + JSON.stringify(value));
      })
      .catch(err => {
          // Return default code for HTTP "Not Found" (=404) 
          res.sendStatus(404);
          console.log('In app.get. Url= /api/sproc/' + req.params.SprocNameIn + ". Error= " + JSON.stringify(err) + " (404)");
      });
    }
  // }
  );
// }
// );


// Deze functie vangt een POST request met URL /api/sproc op en haalt de naam van de sproc uit parameter :SprocNameIn.
// De waarde van de parameters (precies 2) wordt gehaald uit :SprocParmIn1 en :SprocParmIn2.
// Waarna DHOFOLIOGetDBData met de naam van de sproc en de parameters van de Sproc als parameter uitgevoerd wordt 
// om de gegevens uit de database te halen. 
// De functie verifyToken wordt gebruikt om deze url middels een token te beschermen tegen onbedoelde toegang.
// Deze code is bedoeld om calls voor Sprocs met 2 parameters af te handelen.
// --------------------------------------------
// app.get('/api/sproc/:SprocNameIn/:SprocParmIn', verifyToken, (req, res) => {
  app.get('/api/sproc/:SprocNameIn/:SprocParmIn1/:SprocParmIn2', (req, res) => {
    console.log('In app.get. Url= /api/sproc/' + req.params.SprocNameIn + '/' + req.params.SprocParmIn1 + '/' + req.paramsSprocParmIn2);
    // console.log("Request headers are: " + req.rawHeaders);
    // jwt.verify(req.token, '<TheSecretKey>', (err, authData) => {
    //   if (err) {
    //     res.sendStatus(403);
    //     console.log('In app.get. Url= /api/sproc/' + req.params.SprocNameIn + ". Status= Forbidden (403)");
    //   } else {
        DHOFOLIOGetDBDataWithParms2(req.params.SprocNameIn, req.params.SprocParmIn1, req.params.SprocParmIn2)
        .then((value) => {
            res.json(
              // message: 'Post created....',
              // authData: authData,
              value
            );
  
            // res.json({
            //   // message: 'Post created....',
            //   // authData: authData,
            //   Databack: value
            // });
  
  
            console.log('In app.get. Url= /api/sproc/' + req.params.SprocNameIn1 + '/' + req.params.SprocParmIn1 + '/' + req.params.SprocParmIn2 + ". Status= Data send back to requestor (200). Data=" + JSON.stringify(value));
        })
        .catch(err => {
            // Return default code for HTTP "Not Found" (=404) 
            res.sendStatus(404);
            console.log('In app.get. Url= /api/sproc/' + req.params.SprocNameIn + ". Error= " + JSON.stringify(err) + " (404)");
        });
      }
    // }
    );
  // }
  // );




// Deze functie biedt login mogelijkheden om daarmee vervolgens een token op te halen die nodig zijn om bepaalde url's te kunen aanroepen.
// Deze functie maakt nog gebruik van een mock user en moet nog vervangen worden door code welke volledige autenticatie doet
// Boilerplate= get user id/name/password en valideer dat tegen een bron.
//TODO: reguliere authenticatie code schrijven om bv de <TheSecretKey> te bewaren en op te kunnen halen
app.post('/api/login', (req, res) => {
  console.log('In app.post /api/login');
  const user = {
    id: 1,
    username: 'JosB' ,
    email: 'jos@deheleolifant.com'  
  }
  // Deze functie maakt/haalt een token obv eerdere autheticatie (zie hierboven).
  jwt.sign({user: user}, '<TheSecretKey>', { expiresIn: '24h' }, (err, token) => {
    res.json({
      token: token
    });
  });
});

app.post('/api/sproc/:SprocNameIn/:SprocParmIn', (req, res) => {
  console.log('In app.post /api/sproc/');
  console.log('In app.post /api/sproc/ - SprocNameIn= ' + req.params.SprocNameIn);
  console.log('In app.post /api/sproc/ - SprocParmIn= ' + req.params.SprocParmIn);
  console.log('In app.post /api/sproc/ - Content of SprocParmIn= ' + JSON.stringify(req.params.SprocParmIn));
  console.log('In app.post /api/sproc/ - Content of SprocParmIn.Naam= ' + req.params.SprocParmIn.Naam);
  res.sendStatus(404);

});

// Deze functie verificeert een token en wordt gebruikt bij het "opvangen" van url's om te bepalen of er antwoord op gegeven mag worden.
function verifyToken(req, res, next) {
  const bearerHeader = req.headers['authorization'];
  if (typeof bearerHeader !== 'undefined' ) {
    const bearer = bearerHeader.split(' ');
    const bearerToken = bearer[1];
    req.token = bearerToken;
    next();
  } else {
    // TODO 27-12-2020: Log some additional client info in order to see who fired the " illegal"  request.
    console.log("Verification of Token failed, sending Forbidden (403).");
    res.sendStatus(403);
  }
}


// Deze aanroep creert een https server met TLS
var httpsServer = https.createServer(credentials, app);

// Deze aanroept zorgt dat de hierboven gecreerde server gaat luisteren
httpsServer.listen(port), () => { console.log("SSL & CORS enabled API server listening on port: " +  port)};

