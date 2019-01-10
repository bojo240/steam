const puppeteer = require('puppeteer');
const fs = require('fs-extra');

(async function main()
{
	try {
		
		const browser = await puppeteer.launch({ headless: false, args: ['--window-size=1920,1040'] });
		const page = await browser.newPage();
		await page.setViewport({ width: 1920, height: 1040 });
		
		page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.75 Safari/537.36');
		
		await page.goto('https://cs.money/list_overstock?fbclid=IwAR0Z9rpCD_o2OtrVYslvpQzhmaG7C3FmGZyajPbozWJ7ZcCnRernQYRJPcQ');
		await page.waitFor(500);
		const over = ('body > pre');
		const overstock = await page.$eval(over, over => over.innerText);
		
		await page.goto('https://cs.money/');
		await page.waitForSelector('#main_container_bot > div.items');
		await page.waitFor(5000);
		
		//TODO upewnic sie co do jezyka i waluty na stronie zanim zacznie robic
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
		
		//Niezbedne kody HTML
		const linkHTML ='body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > div.clearfix > ul > li:nth-child(3) > a';
		const priceHTML = 'body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > div.clearfix > div.ip_price';
		const nameHTML = 'body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > div.ip_header > div.ip_name > span';
		const name2HTML = 'body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > div.ip_header > div.ip_name > div.ip_name_big';
		const doplataHTML = 'body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > div.markup_main_container';

		//Niezbedne zmienne
		var prevname = 'Nazwa';
		var prevprice = 'Cena Cs.Money';
		var prevlink = 'Link do Steam';
		var prevdoplata = false;
		
		var link = '';
		var price = 0.0;
		var name = '';
		var doplata = false;
		
		await fs.writeFile('csitems.csv','');

		//petla glowna skryptu
		for(var i = 1; i < 10000; ++i)
		{
			var itemHTML = "#main_container_bot > div.items > div:nth-child("+i+")";
			var name3HTML = "#main_container_bot > div.items > div:nth-child("+i+") > div.s_c > div";

			await page.click(itemHTML, { button: "right"}); 

			try//jezeli nie widzi itemu, scrolluje na dol, dekrementuje zmienna 'i', a nastepnie continue;
			{
				link = await page.$eval(linkHTML, linkHTML => linkHTML.href);
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
			
			await page.waitFor(500);
			
			price = await page.$eval(priceHTML, priceHTML => priceHTML.innerText);
			price = price.substr(2);
			
			var name2 = await page.$eval(name2HTML, name2HTML => name2HTML.innerText);
			var name3 = await page.$eval(name3HTML, name3HTML => name3HTML.innerText);
			if(name3.contains('FN'))
				name3 = '(Factory New)';
			else if(name3.contains('MW'))
				name3 = '(Minimal Wear)';
			else if(name3.contains('FT'))
				name3 = '(Field Tested)';
			else if(name3.contains('WW'))
				name3 = '(Well Worn)';
			else if(name3.contains('BS'))
				name3 = '(Battle Scarred)';
			name = name2 + ' | ' + await page.$eval(nameHTML, nameHTML => nameHTML.innerText) + ' ' + name3;
						
			doplata = true;
			try // jezeli nie moze znalezc diva z doplatami, znaczy ze doplaty nie ma
			{
				await page.waitForSelector(doplataHTML,{ timeout: 500 });
			} 
			catch (error) 
			{
				doplata = false;
			}
			console.log(prevname + '\n' + prevprice + '\n' + prevlink + '\n' + prevdoplata + '\n' + 'prevlink != link  ' + (prevlink != link) + '\n' + '!prevname.contains("Doppler")  ' + (!prevname.contains("Doppler")) + '\n' + '!prevdoplata  ' + (!prevdoplata) + '\n' + 'overstock.contains(prevname)  ' + (overstock.contains(prevname)) + '\n\n' + name + '\n' + price + '\n' + link + '\n' + doplata + '\n\n\n\n');
			
			if(prevlink != link && !prevname.contains("Doppler") && !prevdoplata && !overstock.contains(prevname)) //jezeli nowy item, zapisz dotychczasowe wartosci, o ile pasuja do kryteriow
				await fs.appendFile('csitems.csv', `${prevname}; ${prevprice}; ${prevlink};\n`);
				//zmienne ustaw na nowe wartosci;

			if(price < prevprice && prevlink == link && !prevname.contains("Doppler") && !prevdoplata && !overstock.contains(prevname))//jezeli to ten sam item, zmien cene(o ile mniejsza)
				price = prevprice;//zostaw stara cene
			prevlink = link;
			prevprice = price;
			prevname = name;
			prevdoplata = doplata;
		}
		console.log('done');
		await browser.close();
	} catch (e)
	{
		console.log('our error', e);
	}
})();

//TODO gdy link sie nie zmienia, cena sie nadpisuje jezeli jest mniejsza. gdy link sie zmienia, zapisywane sa wszystkie ostatnio znane price, name, link.

//sprawdz czy link sie zmienil, jezeli tak to zapisz dotychczasowe wartosci, jezeli nie to zmien cene produktu

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
