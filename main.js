const fs = require("fs");
const { parse } = require("csv-parse");
const ttest = require("ttest");



async function loadCsv(name) {
    try {
        return new Promise((resolve, reject) => {
            fs.readFile('data/'+name + '.csv', 'utf8',function (err, f, ) {
                if(!err) {
                    resolve(toJSON(f))
                } else {
                    console.error(`${name} not found...`);
                    reject();
                }

            })
        })

    }catch (e) {
        console.error(`${name} not found...`);
    }
}

// https://stackoverflow.com/questions/16831250/how-to-convert-csv-to-json-in-node-js
const toJSON = csv => {
    const lines = csv.replaceAll("\"", "\'").split('\n')
    const result = []
    const headers = lines[0].split(',')

    lines.map(l => {
        const obj = {}
        const line = l.split(',')

        headers.map((h, i) => {
            obj[h] = line[i]
        })

        result.push(obj)
    })

    return result
}


function groupByProduct(obj) {
    let totalTimePerProduct = [];
    obj.forEach(l => {
        if(l.Product !== '') {
            let fndProd = totalTimePerProduct.find(p => p.Product === l.Product)
            if(fndProd) {
                fndProd.time.push(parseInt(l['Duration(ms)']))
                fndProd.viewed += 1;
            } else {
                totalTimePerProduct.push({Product: l.Product, time: [parseInt(l['Duration(ms)'])], viewed: 1})
            }
        }


    })
    return totalTimePerProduct;
}

function merge(f1, f2) {

    // contains objects e.g. {Product: "", time: {f1: 0, f2: 0}
    const res = [];


    f1.forEach(f => {
        if(f2.find(t => t.Product === f.Product)) {
            const p2 = f2.find(t => t.Product === f.Product)
            res.push(
                {
                    Product: f.Product,
                    viewed: {
                      f1: f.viewed,
                      f2:   p2.viewed
                    },
                    time: {
                        f1: f.time,
                        f2: p2.time
                    }
                }
            )
        }


    })
    return res;

}


function runTTestProArtikel(data) {
    return new Promise(resolve => {
        const signifikant = [];
        const verteilungen = [];
        data.forEach(d => {
            let s = ttest(d.time.f1,d.time.f2);
            if(s.pValue() < 0.05) {
                signifikant.push({Product: d.Product, pValue: s.pValue()});
            }
            verteilungen.push({Product: d.Product, dist: s._dist._df});
        })
        resolve({s:signifikant, v: verteilungen});
    })

}


function getTotalTimeSpent(file) {

    let total = 0;
    file.forEach(f => {
        if(!isNaN(f['Duration(ms)'])) total += parseInt(f['Duration(ms)'])

    })
    return total;
}

// calculates how many of the same products were viewed
function getCountSameProducts(f1, f2) {
    let count = 0;
    f1.forEach(f => {
        count += (f2.find(g => g.Product === f.Product) ? 1 : 0);
    })
    console.log(count);
}

// calculates how many per prod
function getCountSameProducts(f1, f2) {
    let count = 0;
    f1.forEach(f => {
        count += (f2.find(g => g.Product === f.Product) ? 1 : 0);
    })
    console.log(count);
}

function getUniqueUsers(f1, f2) {
    let users = [];
    f1.forEach(f => {
        if(!users.includes(f.UserId)) {
            users.push(f.UserId)
        }
    })
    f2.forEach(f => {
        if(!users.includes(f.UserId)) {
            users.push(f.UserId)
        }
    })
    return users;
}
function getPopulationVarianceDifference(f1, f2) {
    console.log(ttest(f1))
}






async function compare(f1, f2) {
    // load and parse the data
    const dataF1 = await loadCsv(f1);
    const dataF2 = await loadCsv(f2);
   // console.log(dataF1)
    const totalTimeF1 = getTotalTimeSpent(dataF1);
    const totalTimeF2 = getTotalTimeSpent(dataF2);


    getCountSameProducts(dataF1, dataF2);
    getUniqueUsers(dataF1, dataF2);

    // sum up time based on product and get average per product
    const gbpF1 = groupByProduct(dataF1);
    const gbpF2 = groupByProduct(dataF2);

    // merge two arrays based on product
    const merged = merge(gbpF1, gbpF2);
 //   console.log(merged)



    // run ttest -  returns array with p-value < 0.05
    const ttested = await runTTestProArtikel(merged);
    console.log('---pValue----')
    console.log(ttested.s)

    console.log('---Verteilung----')
    console.log(ttested.v)

    console.log(`Time spent F1: ${totalTimeF1}`)
    console.log(`Time spent F2: ${totalTimeF2}`)


}


compare('WebsiteA1', 'WebsiteC1').then()

