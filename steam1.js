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
	
	//cs.money
	await page.goto('https://cs.money/');
	await page.waitForSelector('#main_container_bot > div.items');
	await page.waitFor(2000);
	await autoScroll(page);
	await page.waitFor(20000); //time to load
	
	const higherPriceHTML = '#slider_price > div.price_inputs.superclass_space > label:nth-child(3) > input[type="tel"]';
	const lowerPriceHtml = '#slider_price > div.price_inputs.superclass_space > label:nth-child(1) > input[type="tel"]';

	await page.evaluate((higherPriceHTML, lowerPriceHtml) => {
      document.querySelector(higherPriceHTML).value = '';
	  document.querySelector(lowerPriceHtml).value = '';
    }, higherPriceHTML, lowerPriceHtml);
	
	const lowerPrice = '15';
	const higherPrice = '132';
	
	await page.focus(lowerPriceHtml);
	await page.keyboard.type(lowerPrice);
	await page.focus(higherPriceHTML);
	await page.keyboard.type(higherPrice);
	
	await page.waitFor(20000); //time to load
	
	//Niezbedne kody HTML
	const linkHTML ='body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > div.clearfix > ul > li:nth-child(3) > a';
	const priceHTML = 'body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > div.clearfix > div.ip_price';
	const nameHTML = 'body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > div.ip_header > div.ip_name > span';
	const name2HTML = 'body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > div.ip_header > div.ip_name > div.ip_name_big';
	const doplataHTML = 'body > div.body_scroll > div.wrapper_popups > div.item_popup_container > div > div.markup_main_container';
	
	//Niezbedne zmienne
	var link = '';
	var price = 0.0;
	var name = '';
	var doplata = false;
	var data = wyswietlDate();
	var overstock = false;
	
	const filename = 'csitems2.csv';
	
	var itemyString = fs.readFileSync(filename, 'utf8');
	var itemy = convertCSVToArray(itemyString, {
		type: 'array',
		separator: ';', 
	});
	
	//po zaladowaniu pliku do programu, wyczysc go
	await fs.writeFile(filename,'');

	//sprawdz czy dotychczasowe itemy nie pojawily sie na overstocku
	for(var i = 1; i<itemy.length; ++i)
	{
		itemy[i][3] = false;
		if(over.contains(itemy[i][0]))
			itemy[i][3] = true;
	}

	
	//petla glowna skryptu
	for(var i = 1; i < 6000; ++i)
	{
		var itemHTML = "#main_container_bot > div.items > div:nth-child("+i+")";
		var name3HTML = "#main_container_bot > div.items > div:nth-child("+i+") > div.s_c > div";
		try
		{
		await page.click(itemHTML, { button: "right"}); 
		}
		catch
		{
			break;
		}
		try//zmienna link -- jezeli nie widzi itemu, scrolluje na dol, dekrementuje zmienna 'i', a nastepnie continue;
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
			catch (e) 
			{}
			continue;
		}
		

		await page.waitFor(500 + itemy.length);
		
		//zmienna price
		price = await page.$eval(priceHTML, priceHTML => priceHTML.innerText);
		price = price.substr(2);
		
		//zmienna name
		var name2 = await page.$eval(name2HTML, name2HTML => name2HTML.innerText);
		var name3 = '';
		try
		{
			name3 = await page.$eval(name3HTML, name3HTML => name3HTML.innerText);
		}
		catch
		{
			continue;
		}
		if(name3.contains('FN'))
			name3 = '(Factory New)';
		else if(name3.contains('MW'))
			name3 = '(Minimal Wear)';
		else if(name3.contains('FT'))
			name3 = '(Field-Tested)';
		else if(name3.contains('WW'))
			name3 = '(Well-Worn)';
		else if(name3.contains('BS'))
			name3 = '(Battle-Scarred)';
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
		
		//zmienna overstock
		overstock = false;
		if(over.contains(name))
			overstock = true;
		
		//zanim zapiszesz, sprawdz czy juz tego itema nie bylo
		var czyjestitem = false;
		if(!name.contains("Doppler") && !doplata) //jezeli nowy item, zapisz dotychczasowe wartosci, o ile pasuja do kryteriow
		{
			for(var j = 0; j<itemy.length; ++j)
				if(name == itemy[j][0])
				{
					czyjestitem = true;
					itemy[j][4] = data;
					if(price < itemy[j][1])
						itemy[j][1] = price;
					break;
				}
				
			if(czyjestitem == false)
				itemy.push([name,price,link,overstock,data]);
		}
		console.log(price+'\n');

		// GDY JEDEN SKRYPT PRZECIAZY STEAMA, WSZYSTKIE INNE TEZ PRZESTAJA DZIALAC! :C
		// A MOZE LOSOWANIE LINKOW COS BY DALO NA TE PRZECIAZENIE?
		// MUSI COS BYC Z kwestia zalogowania na chocby randomowe konto
		// aero2 ogarnac
	}
	
	//zapisz z powrotem wszystko do pliku
	for(var i = 0; i<itemy.length; ++i)
		await fs.appendFile(filename,`${itemy[i][0]};${itemy[i][1]};${itemy[i][2]};${itemy[i][3]};${itemy[i][4]}\n`);

	console.log('done');
	await browser.close();

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

String.prototype.contains = function(test) {
    return this.indexOf(test) == -1 ? false : true;
};

function wyswietlDate(){
    var Today = new Date();
    var Month = Today.getMonth() + 1;
	Month = Month.toString();
	if(Month.length==1)
		Month = '0' + Month;
    var Day = Today.getDate();
    var Year = Today.getFullYear();
       if(Year <= 99)    Year += 2000
    return  Year + "-" + Month + "-" + Day;
}
