//remove Join metadata
//for non raw findall query with only theme/category attribute,
//turn furniture.themes/categories into [theme, theme] or [category, category]
function removeJoinMetaData(joinedTable){
    removed = []
    joinedTable.forEach(element => {
        removed.push(Object.values(element.dataValues)[0])
    });
    return removed
}
module.exports = {removeJoinMetaData};