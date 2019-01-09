const puppeteer = require('puppeteer');
const fs = require('fs-extra');

(async function main()
{
	try {
		const browser = await puppeteer.launch({headless: false});
		const page = await browser.newPage();
		//page.setUserAgent('...');
		await page.goto('https://steamcommunity.com/market/listings/730/%E2%98%85%20StatTrak%E2%84%A2%20Navaja%20Knife%20%7C%20Crimson%20Web%20%28Field-Tested%29#');
		//await page.waitForNavigation();
		await page.waitForSelector('#market_commodity_buyrequests');
		await page.waitFor(3000);
		await fs.writeFile('price.csv','\n');
		//const lis = await page.$$('#market_commodity_buyrequests > span');
		const text2 = await page.evaluate(() => document.querySelector('#market_commodity_buyrequests').innerText);
		//const text2 = await page.evaluate(() => {
		//return [...document.body.querySelectorAll('#market_commodity_buyrequests')]
        //       .map(element => element.innerText)
        //       .join('\n');
		//});
		//const price = lis[2];//.innerText;
		await fs.appendFile('price.csv', `"${text2}"\n`);
		
		console.log('done');
		await browser.close();
	} catch (e)
	{
		console.log('our error', e);
	}
})();
