const puppeteer = require('puppeteer');
const fs = require('fs-extra');

(async function main()
{
	try {
		
		const browser = await puppeteer.launch({ headless: false, args: ['--window-size=1920,1040'] });
		const page = await browser.newPage();
		await page.setViewport({ width: 1920, height: 1040 });
		//page.setUserAgent('...');
		await page.goto('https://cs.money/');
		//await page.waitForNavigation();
		await page._client.send('Emulation.clearDeviceMetricsOverride')

		await page.waitForSelector('#main_container_bot > div.items');
		await page.waitFor(3000);
		await autoScroll(page);
		
		await page.waitFor(10000); //time to scroll
/*

		*/
		const items = await page.$$('#main_container_bot > div.items');
		try
		{
			for ( var i = 0; i <1500; i++)
			{
				const scrollable = await page.$eval
				(
				'#block_items_bot > div.block_content', e=>
				{
					
					e.scrollTop = e.scrollTop + 200;
					// await page.evaluate(selector => 
					// {
						//setTimeout(resolve, 1000)
						// const scroll = document.querySelector(selector);
						// scroll.scrollTop = scroll.offsetHeight;
					// }, scrollable);
					return e;
				}
				)
			}
		}
		catch (e) {
		  console.log(e)
		}
		await page.waitFor('1000000');
		await page.click("#main_container_bot > div.items > div:nth-child(1)", { button: "right" }); // right click a node at `contextmenu` part
		await page.waitFor(1000); //time to scroll
		
		const link ='body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > div.clearfix > ul > li:nth-child(3) > a';
		
		const linkk = await page.$eval(link, link => link.href);
		
		console.log(linkk);

		await page.goto(linkk);
		/*
		await fs.writeFile('csitems.csv','price\n');
		
		for (const item of items)
		{
			const selectorrr  = '#main_container_bot > div.items > div:nth-child(1) > div.p';
			const price = await item.$eval('#main_container_bot > div.items > div:nth-child(1) > div.p',selectorrr=>selectorrr);
			await fs.appendFile('csitems.csv', `"${price}"\n`);
		}
		*/
		console.log('done');
		await browser.close();
	} catch (e)
	{
		console.log('our error', e);
	}
})();

async function autoScroll(page){
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(totalHeight >= scrollHeight){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });
}