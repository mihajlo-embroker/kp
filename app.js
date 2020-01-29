const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({headless: false, slowMo: 100})
    // const browser = await puppeteer.launch()
    const page = await browser.newPage()

    const navigationPromise = page.waitForNavigation()

    await page.goto('https://www.kupujemprodajem.com/Elektronika-i-komponente/Kontroleri/search.php?action=list&data%5Bpage%5D=1&data%5Bad_kind%5D=goods&data%5Bprev_keywords%5D=regulator+pusnice&data%5Bcategory_id%5D=821&data%5Bgroup_id%5D=1120&data%5Border%5D=relevance&submit%5Bsearch%5D=Tra%C5%BEi&dummy=name&data%5Bkeywords%5D=regulator')

    await page.setViewport({ width: 1200, height: 800 })

    await navigationPromise

    const listOfAddIds = await page.evaluate((selector) => {
        const anchors_node_list = document.querySelectorAll(selector);
        const arr = [...anchors_node_list];
        return arr.filter(node => {
            return node.id.indexOf('adDescription') !== -1 ? true : false;
        }).map(div => `#${div.id}`);
        // return arr;
    }, '#adListContainer > div');


    let adds = []
    for (const addID of listOfAddIds) {
        const addTitle = await page.$eval(`${addID} > div > section.nameSec > div.fixedHeight > div:nth-child(1) > a`, d => d.innerHTML.trim());
        const addPrice = await page.$eval(`${addID}  > div > section.priceSec > span`, (d) => {
            const [ price, currency ] =  d.innerHTML.trim().split('&nbsp;');
            return { price, currency };
        });
        adds.push({ addTitle, addPrice });
    }

    console.log('adds :', adds);
    await page.click('#middleCol > div: nth - child(10) > ul > li: nth - child(6) > a')


    await browser.close()
})()