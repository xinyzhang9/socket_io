import urllib
def makeStr(n):
	s = str(n)
	res = ""
	if len(s) == 1:
		res = "00"+s
	elif len(s) == 2:
		res = "0"+s
	else:
		res = s
	return res

for i in range(151):
	url = 'http://assets.pokemon.com/assets/cms2/img/pokedex/full/'+makeStr(i)+'.png'
	imgName = str(i)+'.png'
	urllib.urlretrieve(url,imgName)

