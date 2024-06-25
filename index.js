const express = require("express");
const { google } = require("googleapis");

require('dotenv').config()
require("express/lib/request");

const app = express();

app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function getAuthSheets(){
    const auth = new google.auth.GoogleAuth({
        scopes: "https://www.googleapis.com/auth/spreadsheets",
        keyFile: 'credentials.json'
    })

    const client = await auth.getClient();

    const googleSheets = google.sheets({
        version: "v4",
        auth: client,
    });

    const spreadsheetId  = process.env.GOOGLE_ID;

    return{
        auth, client, googleSheets, spreadsheetId 
    };
}

app.listen(3001, () => console.log("Porta para teste no insomnia => [3001]"));

app.get("/metadata", async (req,res)=> {
    const {googleSheets, auth, spreadsheetId } = await getAuthSheets();

    const metadata = await googleSheets.spreadsheets.get({
        auth,
        spreadsheetId 
    });

    res.send(metadata.data);
});

app.get("/getRows", async (req, res) => {
    try {
      const { googleSheets, auth, spreadsheetId } = await getAuthSheets();
  
      const getRows = await googleSheets.spreadsheets.values.get({
        auth,
        spreadsheetId,
        range: "Página1",
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      });
  
      res.send(getRows.data);

    } catch (error) {
      console.error('Erro ao receber parametros da tabela', error);
      res.status(500).send('Erro ao receber dados');
    }
});

app.post('/submitForm', async (req, res) => {
    try {
        const { values } = req.body; 
        const [data] = values; 

        const { googleSheets, spreadsheetId } = await getAuthSheets();

        const response = await googleSheets.spreadsheets.values.append({
            spreadsheetId,
            range: "Página1",
            valueInputOption: "USER_ENTERED",
            resource: { values }
        });

        res.status(200).send({ message: 'Dados inseridos com sucesso!', data: response.data });
    } catch (error) {
        console.error('Erro ao inserir dados na planilha', error);
        res.status(500).send({ message: 'Erro ao inserir dados na planilha' });
    }
});

//   app.post("/updateValue", async (req, res) => {
//     const { googleSheets, auth, spreadsheetId } = await getAuthSheets();
  
//     const { values } = req.body;
  
//     const updateValue = await googleSheets.spreadsheets.values.update({
//       spreadsheetId,
//       range: "Página1!A2:C2",
//       valueInputOption: "USER_ENTERED",
//       resource: {
//         values: values,
//       },
//     });
  
//     res.send(updateValue.data);
//   });