const puppeteer = require('puppeteer');
const fs = require('fs-extra');

(async function main()
{
	try {
		
		const browser = await puppeteer.launch({ headless: true, args: ['--window-size=1920,1040'] });
		const page = await browser.newPage();
		await page.setViewport({ width: 1920, height: 1040 });
		//page.setUserAgent('...');
		await page.goto('https://cs.money/list_overstock?fbclid=IwAR0Z9rpCD_o2OtrVYslvpQzhmaG7C3FmGZyajPbozWJ7ZcCnRernQYRJPcQ');
		await page.waitFor(500);
		const over = ('body > pre');
		const overstock = await page.$eval(over, over => over.innerText);
		await page.goto('https://cs.money/');
		await page.waitForSelector('#main_container_bot > div.items');
		await page.waitFor(5000);
		//change currency to $
		// const plntodol = '#header_panel > div.header_menu_mobile > div > div.header_drop.currency';
		// await page.hover(plntodol);
		// await page.waitFor(1000);
		// await page.click('#currency_drop > ul > li:nth-child(1) > a > span.currency_currency');
		//change language to eng
		// const pltoeng = '#header_panel > div.header_menu_mobile > div > div.header_drop.lang';
		// await page.hover(pltoeng);
		// await page.waitFor(1000);
		// await page.click('#lang_drop > ul > li:nth-child(1) > a');
		
		await autoScroll(page);
		await page.waitFor(15000); //time to load
		const items = await page.$$("div.items > div.item");
		const link ='body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > div.clearfix > ul > li:nth-child(3) > a';
		const price = 'body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > div.clearfix > div.ip_price';
		const name = 'body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > div.ip_header > div.ip_name > span';
		const name2 = 'body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > div.ip_header > div.ip_name > div.ip_name_big'

		const zle = 'body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > ul'
		var prevlinkk = '';
		//TODO sprawdzic czy nie weszloby childnodes zamiast nth-child w item/items
		await fs.writeFile('csitems.csv','name ; price ; link\n');
		for(var i = 1; i < 10000; ++i)
		{
			var item = "#main_container_bot > div.items > div:nth-child("+i+")";
			await page.click("#main_container_bot > div.items > div:nth-child("+i+")", { button: "right"}); // right click a node at `contextmenu` part
			try
			{

				var linkk = await page.$eval(link, link => link.href);
			}
			catch (error)
			{
				--i;
				try
				{
					const scrollable = await page.$eval
					(
					'#block_items_bot > div.block_content', e=>
					{
						e.scrollTop = e.scrollTop + 100;
						return e;
					}
					)

				}
				catch (e) {}
				continue;
			}
			await page.waitFor(500); //time to load
			var name3 = '#main_container_bot > div.items > div:nth-child('+i+') > div.s_c > div';
			var pricee = await page.$eval(price, price => price.innerText);
			pricee = pricee.substr(2);
			var namee2 = await page.$eval(name2, name2 => name2.innerText);
			var namee3 = await page.$eval(name3, name3 => name3.innerText);
			if(namee3.contains('FN'))
				namee3 = '(Factory New)';
			else if(namee3.contains('MW'))
				namee3 = '(Minimal Wear)';
			else if(namee3.contains('FT'))
				namee3 = '(Field Tested)';
			else if(namee3.contains('WW'))
				namee3 = '(Well Worn)';
			else if(namee3.contains('BS'))
				namee3 = '(Battle Scarred)';
			var namee = namee2 + ' | ' + await page.$eval(name, name => name.innerText) + ' ' + namee3;
			var zlee = await page.$eval(zle, zle => zle.innerHTML);
			var doplata = true;
			try 
			{
			  await page.waitForSelector('body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > div.markup_main_container',{ timeout: 500 });
			  
			} catch (error) {
				doplata = false;
			}
			if(prevlinkk != linkk && namee.contains("Doppler") == false && !doplata && overstock.contains(namee) == false)
			{
				prevlinkk = linkk;
				await fs.appendFile('csitems.csv', `${namee}; ${pricee}; ${linkk};\n`);
			}
		}
		console.log('done');
		await browser.close();
	} catch (e)
	{
		console.log('our error', e);
	}
})();

//TODO gdy link sie nie zmienia, cena sie nadpisuje jezeli jest mniejsza. gdy link sie zmienia, zapisywane sa wszystkie ostatnio znane price, name, link.

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

String.prototype.contains = function(test) {
    return this.indexOf(test) == -1 ? false : true;
};
