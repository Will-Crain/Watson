global.showSales = function() {
    let orders = Game.market.outgoingTransactions
    let byBuyer = _.groupBy(orders, s => s.recipient ? s.recipient.username : 'SCREEPS')
    outstr = ''
    
    for (let v in byBuyer) {
        outstr += v + ' (' + _.size(byBuyer[v]) + ' | ' + _.sum(byBuyer[v], s => s.order.price * s.amount).toFixed(2) + ')'
        // for (let p of byBuyer[v]) {
        //     outstr += `\n\t<font color=${RES_COLORS[p.resourceType]}>${p.amount}</font>\t(${(p.order.price * p.amount).toFixed(2)})`
        // }
        outstr += `\n`
    }
    console.log(outstr)
}