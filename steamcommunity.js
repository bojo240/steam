const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const { convertCSVToArray } = require('convert-csv-to-array');
const converter = require('convert-csv-to-array');

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
	
	await page.goto('https://steamcommunity.com/login/home/?goto=');
	
	const login = '#steamAccountName';
	const pass = '#steamPassword';
	
	await page.focus(login);
	await page.keyboard.type('dobocenia1');
	
	await page.focus(pass);
	await page.keyboard.type('Dobocenia2');
	
	await page.click('#SteamLogin');
	
	await page.waitFor(1000);
	
	var itemyString = fs.readFileSync('csitems.csv', 'utf8');
	var itemy = convertCSVToArray(itemyString, 
	{
		type: 'array',
		separator: ';', 
	});
	
	//sprawdz czy dotychczasowe itemy nie pojawily sie na overstocku
	for(var i = 0; i<itemy.length; ++i)
	{
		itemy[i][3] = false;
		if(over.contains(itemy[i][0]))
			itemy[i][3] = true;
	}
	
	console.log(itemy.length);
	
	const cenaHTML = '#market_commodity_buyrequests';
	const czyprzeciazoneHTML = '#message'
	const czyjestitemHTML = '#largeiteminfo';

	for(var i = 0; i<itemy.length; ++i)
	{
		if((parseInt(itemy[i][1]) < 70 && parseInt(itemy[i][1]) > 2 ) || itemy[i][3] == true) // jezeli jest na overstocku, albo w przedziale pomiedzy 2$ a 70$, idz dalej
			continue;
		await page.goto(itemy[i][2]);
		await page.waitFor(1500);
		try
		{
			await page.waitForSelector(czyjestitemHTML, {timeout:100});
			
			try // sprawdz czy widzisz cene
			{
				await page.waitForSelector(cenaHTML , {timeout:100}); // jezeli tak to rob, jak nie to poczekaj i odswiez
				var cena = await page.$eval(cenaHTML, cenaHTML => cenaHTML.innerText);
				console.log(i);
				var cenasteam = cena.substr(cena.indexOf('$')+1,cena.indexOf(' ', cena.indexOf('$')) - cena.indexOf('$'));
				cenasteam = cenasteam.replace(',','');
				var stosunek = parseInt(itemy[i][1]) / parseInt(cenasteam);
				await fs.appendFile('csitemswithsteamprice.csv',`${itemy[i][0]};${itemy[i][1]};${itemy[i][2]};${itemy[i][3]};${itemy[i][4]};${cenasteam};${stosunek}\n`);
			}
			catch (e) // jezeli nie widzisz ceny, poczekaj 10 sekund i odswiez
			{
				await page.waitFor(10000);
				--i;
				continue;
				
			}
		}
		catch (error) //jezeli nie widzi itemu
		{
			try // sprawdz czy przeciazone, jezeli tak to poczekaj i odswiez
			{
				await page.waitForSelector(czyprzeciazoneHTML, {timeout:500});
				console.log('przeciazone');
				--i;
				await page.waitFor(20000);
			}
			catch (e) // jezeli itemu nie ma, i nie jest przeciazone, idz dalej
			{}
		}
	}
	console.log('done');
	await browser.close();

})();

String.prototype.contains = function(test) {
    return this.indexOf(test) == -1 ? false : true;
};

		//const text2 = await page.evaluate(() => {
		//return [...document.body.querySelectorAll('#market_commodity_buyrequests')]
        //       .map(element => element.innerText)
        //       .join('\n');
		//});
		//const price = lis[2];//.innerText;