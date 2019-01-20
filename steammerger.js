const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const { convertCSVToArray } = require('convert-csv-to-array');
const converter = require('convert-csv-to-array');

//Nazwa;Cena cs.money;Link;Overstock;Data;Cena Steam;Stosunek

(async function main()
{
	const browser = await puppeteer.launch({ headless: true, args: ['--window-size=1920,1040'] });
	const page = await browser.newPage();
	await page.setViewport({ width: 1920, height: 1040 });

	page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36');
	
	//Overstock
	await page.goto('https://cs.money/list_overstock?fbclid=IwAR0Z9rpCD_o2OtrVYslvpQzhmaG7C3FmGZyajPbozWJ7ZcCnRernQYRJPcQ');
	
	await page.waitFor(500);
	const overHTML = ('body > pre');
	const over = await page.$eval(overHTML, overHTML => overHTML.innerText);
	
	var filename = 'csitems.csv';

	var itemyString = fs.readFileSync(filename, 'utf8');
	var itemy = convertCSVToArray(itemyString, {
		type: 'array',
		separator: ';', 
	});

	for(var i = 0; i<itemy.length; ++i)
	{
		itemy[i][3] = false;
		if(over.contains(itemy[i][0]))
			itemy[i][3] = true;
	}
	
	
	await fs.writeFile(filename,'');
	
	for(var i=1;i<6;++i)
	{
		filename = 'csitems'+i+'.csv';
		itemyString = fs.readFileSync(filename, 'utf8');
		var itemytemp = convertCSVToArray(itemyString, 
		{
			type: 'array',
			separator: ';', 
		});
		
		for(var j = 0; j<itemytemp.length; ++j)
		{	
			var czyjestitem = false;
			for(var k = 0; k<itemy.length; ++k)
				if(itemytemp[j][0].toString()== itemy[k][0].toString())
				{
					czyjestitem = true;
					itemy[k][4] = itemytemp[j][4];
					if(parseInt(itemytemp[j][1]) < parseInt(itemy[k][1]))
						itemy[k][1] = itemytemp[j][i];
					break;
				}
			if(czyjestitem == false)
				itemy.push(itemytemp[j]);
		}
	}
	filename = 'csitems.csv';
	//zapisz z powrotem wszystko do pliku
	for(var i = 0; i<itemy.length; ++i)
		await fs.appendFile(filename,`${itemy[i][0]};${itemy[i][1]};${itemy[i][2]};${itemy[i][3]};${itemy[i][4]}\n`);

	//sprawdz czy dotychczasowe itemy nie pojawily sie na overstocku
	for(var i = 1; i<itemy.length; ++i)
	{
		itemy[i][3] = false;
		if(over.contains(itemy[i][0]))
			itemy[i][3] = true;
	}
	
	console.log('done');
	await browser.close();

})();

String.prototype.contains = function(test) {
    return this.indexOf(test) == -1 ? false : true;
};
