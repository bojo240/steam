const puppeteer = require('puppeteer');

(async function main()
{
	try {
		const browser = await puppeteer.launch({headless: false});
		const page = await browser.newPage();
		//page.setUserAgent('...');
		await page.goto('https://www.google.com/maps/place/DO+%26+CO+Restaurant+Stephansplatz/@48.2082385,16.3693837,17z/data=!4m7!3m6!1s0x476d079f2c500731:0xed65abfb2c337243!8m2!3d48.2082385!4d16.3715725!9m1!1b1');
		await page.waitForNavigation();
		await page.waitFor(3000);
		const scrollable_section = '.section-listbox .section-listbox';

		await page.waitForSelector( '.section-listbox .section-listbox > .section-listbox' );
		await page.click('.section-listbox');
		await page.keyboard.press('Space');
		/*
		await page.evaluate( selector =>
		{
			const scrollableSection = document.querySelector( selector );

			scrollableSection.scrollTop = scrollableSection.offsetHeight;

		}, scrollable_section );
		*/
		await page.waitFor(3000);
		console.log('done');
		await browser.close();
	} catch (e)
	{
		console.log('our error', e);
	}
})();
