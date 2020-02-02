const puppeteer = require('puppeteer');
(async () => {
    let allAdDetails = [];
    // const browser = await puppeteer.launch({headless: false})
    console.log('Scrap loading...');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    const navigationPromise = page.waitForNavigation();

    await page.goto('https://www.kupujemprodajem.com/Elektronika-i-komponente/Kontroleri/search.php?action=list&data%5Bpage%5D=1&data%5Bad_kind%5D=goods&data%5Bprev_keywords%5D=regulator+pusnice&data%5Bcategory_id%5D=821&data%5Bgroup_id%5D=1120&data%5Border%5D=relevance&submit%5Bsearch%5D=Tra%C5%BEi&dummy=name&data%5Bkeywords%5D=regulator');

    await page.setViewport({ width: 1200, height: 800 });

    await navigationPromise;

    const pageNumbers = await page.evaluate((selector) => {
        const arr = document.querySelector(selector).childElements();
        return arr.map(node => node.innerText).filter((text) => {
            return isNaN(parseInt(text)) ? false : true;
        });
    }, '.pagesList');

    const pages = { 'page1': page };
    for (let i = 0; i < pageNumbers.length; i++) {
        const pgNum = pageNumbers[i];
        const pgId = `page${pgNum}`;
        pages[pgId] = await browser.newPage();
        const newUrl = `https://www.kupujemprodajem.com/Elektronika-i-komponente/Kontroleri/search.php?action=list&data%5Bpage%5D=${pgNum}&data%5Bad_kind%5D=goods&data%5Bprev_keywords%5D=regulator+pusnice&data%5Bcategory_id%5D=821&data%5Bgroup_id%5D=1120&data%5Border%5D=relevance&submit%5Bsearch%5D=Tra%C5%BEi&dummy=name&data%5Bkeywords%5D=regulator`;
        await pages[pgId].goto(newUrl);
        const adSelectors = await getAdSelectors(pages[pgId]);
        let pageAdDetails = await getPageAdDetails(pages[pgId], adSelectors);
        allAdDetails = [ ...allAdDetails, ...pageAdDetails ];
        console.log(`# done ${i + 1} of ${pageNumbers.length}`);
        break;
    }
    console.log('allAdDetails found:', allAdDetails.length);

    await browser.close()
})()

/**
 * List of string ad div #selectors
 * [#adSlector1, #adsSelector2...]
 */
async function getAdSelectors(page) {
    const listOfAdIds = await page.evaluate((selector) => {
        const anchors_node_list = document.querySelectorAll(selector);
        const arr = [...anchors_node_list];
        return arr.filter(node => {
            return node.id.indexOf('adDescription') !== -1 ? true : false;
        }).map(div => `#${div.id}`);
        // return arr;
    }, '#adListContainer > div');
    return listOfAdIds;
}


/**
 * List ad ad details
 * { adTitle: 'New ad', adPrice:  {price: 1000, currency: {dinn, euro}}, adDbId: 338}
 */
async function getPageAdDetails(page, listOfAdIds) {
    let ads = []
    for (const adID of listOfAdIds) {
        const adDbId = adID.split('#adDescription')[1]
        const adTitle = await page.$eval(`${adID} > div > section.nameSec > div.fixedHeight > div:nth-child(1) > a`, d => d.innerHTML.trim());
        const adPrice = await page.$eval(`${adID}  > div > section.priceSec > span`, (d) => {
            const [price, currency] = d.innerHTML.trim().split('&nbsp;');
            return { price, currency };
        });
        ads.push({ adTitle, adPrice, adDbId });
    }
    return ads;
}