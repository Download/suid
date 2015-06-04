# suid v0.9.7
Distributed Service-Unique IDs that are short and sweet.
[project website](http://download.github.io/suid/)

Suids are IDs that are:

* Unique across a service or site
* Short
* Ordered
* Easy for humans to read, write and pronounce
* 53 bits so they fit into a single Javascript or PHP Number, Java Long, SQL BigInt etc.

## Download
* Commented (~7kB): [suid.js](https://github.com/Download/suid/releases/download/0.9.7/suid.js)
* Minified (~3 KB): [suid.min.js](https://github.com/Download/suid/releases/download/0.9.7/suid.min.js)
* Map file: [suid.min.js.map](https://github.com/Download/suid/releases/download/0.9.7/suid.min.js.map)

## CDN
* Commented: `//cdn.rawgit.com/download/suid/0.9.7/dist/suid.js`
* Minified : `//cdn.rawgit.com/download/suid/0.9.7/dist/suid.min.js`
* Map file : `//cdn.rawgit.com/download/suid/0.9.7/dist/suid.min.js.map`

## Bower
* `bower install download/suid --save`

## Usage
* Include suid.js on your webpage
* Configure the URL to the suid server using the `data-suid-server` attribute
* Pass options to it using the `data-suid-options` attribute
* Call `Suid()` to generate IDs

## Example
```xml
	<script src="//cdn.rawgit.com/download/suid/0.9.7/dist/suid.min.js" 
			data-suid-server="suid/suid.json"></script>
```
Later on:
```javascript
	var myId = Suid();
	alert(myId);             // 14shd
	alert(myId.valueOf());   // 1204748
	var halve = myId / 2;
	var halveId = new Suid(halve);
	alert(halve);            // 602374
	alert(halveId);          // jd86
	var src = {id: myId, name: 'test'};
	var json = JSON.stringify(src);
	alert(json);             // '{"id":"suid:14shd","name":"test"}
	var dst = JSON.parse(json, Suid.revive);
	alert(dst.id);           // 14shd
```
*Don't create new IDs by adding to existing IDs! Just call `Suid()` again.*

## Need a server? 
Check out the Java EE implementation: [suid-server-java](http://download.github.io/suid-server-java/)

## Options
You can specify options by including the `data-suid-options` attribute in the script element an giving a pseudo-json options string, like so:
```xml
	<script src="//cdn.rawgit.com/download/suid/0.9.7/dist/suid.min.js" 
			data-suid-server="suid/suid.json"
			data-suid-options="{'min':3, 'max':3}"></script>
```
The pseudo-json is basically normal json but with single quotes instead of double.

### Suid pool options
The suid script fetches suid blocks from the suid server and stores them in a pool in [localStorage](http://www.w3.org/TR/webstorage/#storage) ([browser support](http://caniuse.com/#search=localstorage)). This pool is accessible from all tabs that are from the same domain, maximizing the efficient use of suid blocks. 

You can control the behaviour of the pool with two settings:
  
* `min`: Minimum number of suid blocks to keep in the pool, defaults to 2
* `max`: Maximum number of suid blocks to keep in the pool, defaults to 2

Option `min` determines how low the amount of blocks in the pool may become before the script will request new blocks from the server. Option `max` determines how many blocks the script will fetch during each request in order to fill the pool up again. If your application has moments in which it consumes a lot of IDs in a short timeframe, or if your application is expected to be used offline for prolonged periods, choose a `min` that ensures enough IDs will always be in the pool to supply those IDs. If you want to reduce the number of requests for ID blocks (at the expense of more ID blocks going wasted when caches are cleared etc) choose a `max` that is a number of blocks higher then your `min`.

At most 8 blocks can be requested from the pool simultaneously so bear this in mind when configuring your pool. I would guess that the default settings are good enough for most people.

## API documentation
	
Please refer to the [Suid JS API documentation](https://cdn.rawgit.com/download/suid/0.9.7/doc/ws.suid.Suid.html) 
for details on the API.

## Why Suids?
Database IDs are ususally generated by the database itself, using auto-increment. 
The big downside of this is that we need to interact with the server whenever we
need an ID. When we create new objects, we have to leave the ID field blank for
the server to fill in later. When we want to refer to those new objects, we can't
until we have created the new object on the server and have been issued an ID.
This creates a strong dependency on the server that is detrimental for offline apps.
Furthermore database ID's are only unique for the table they correspond with.
Having *just* an ID, we cannot know which record it corresponds with. We would like
to have IDs which are unique across all our tables. 

To solve these issues we can use a distributed ID generator. We could use GUIDs
but they are loooooong. There are some nice solutions out there using randomness 
to generate short IDs, such as [shortid](https://github.com/dylang/shortid). 
However, random-based ID's have a balancing act between uniqueness and length. 
Make them too short and you *will* get collisions. Make them too long and they 
are... well... too long!  ;)

Also these ID generators don't generate ordered IDs. This can be an advantage (from 
a security perspective) but you also lose a lot of pleasant properties that come
with ordered IDs. One of which is that with ordered IDs you start with the shortest
possible IDs and end with the long ones. 

So.. is there middle ground? The best of both worlds? I think so. Which is why I
built Suid.

### Distributed but coordinated
Suids are coordinated by a central server. The server hands out ID blocks, each of
which allows an ID generator to generate up to 256 IDs without any further need
for communication with the server. It's implementation is inspired by 
[the mechanism Flickr uses](http://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap/)
for generating their IDs. Flickr however serves IDs one at a time, whereas Suid
servers hand out IDs in blocks of 256 to minimize network overhead and facilitate
longer periods of offline usage.

### Short
Suids fit in 53-bits, which means they can be treated as a native number in all
major programming languages, including PHP and Javascript. And because they are
ordered, they start out *very* short and only grow longer as time goes by and
more and more of them are issued. They will never become longer than 11 characters.
Here is an example of the length of the ID as more and more IDs get issued:

	Before 1K: XX
	After 1K:  XXX
	After 1M:  XXXXX
	After 1G:  XXXXXXX
	After 1T:  XXXXXXXXX
	After 1P:  XXXXXXXXXXX

The first thousand IDs can be encoded using just two characters. Between a thousand 
and a million IDs can be generated that use three to four characters. From a million
to a billion IDs can be generated using five to six characters. Only after we have
issued dozens of billions of IDs do we get IDs of 8 characters or longer.
 
The total ID space of a suid can contain `9,007,199,254,740,992` or 
9 quadrillion, 7 trillion, 199 billion, 254 million, 740 thousand 992 IDs.  :)

### Sweet
The default representation of a Suid uses 36 different symbols (`0..9a..z`) and are easy
for humans to read, write and pronounce, as well as URL-safe.
Using (only lowercase!) letters in addition to the decimals actually makes the IDs easier
for humans to work with, Just compare:

	14shd
	1204748

Especially when having to read an ID to someone over the phone, adding in uppercase letters
and special symbols such as dash `-`, tilde `~` and underscore `_` makes the process very
error-prone and tedious.

## Technical background
The 53 bits in a suid are distributed over a 64-bit long as depicted below:

	                 HIGH INT                                         LOW INT
	 _______________________________________________________________________________________________
	|                                               |                                               |
	| 0000 0000 | 000b bbbb | bbbb bbbb | bbbb bbbb | bbbb bbbb | bbbb bbbb | bbbb bbii | iiii iiss |
	|_______________________________________________|_______________________________________________|
	
	0 = 11 reserved bits
	b = 43 block bits
	i = 8 ID bits
	s = 2 shard bits

The first 11 bits are reserved and always set to `0`. The next 43 bits are used for
the `block` number. These are handed out by a centralized server. Then there are 8 `ID`
bits which are to be filled in by the generator. The last 2 bits are reserved for the `shard`
ID. To prevent a single point of failure, up to 4 individual hosts can be handing out 
ID's for a certain domain, each with their own `shard` ID.

To make the String representation of suids both short and easy for humans to read, write 
and pronounce, an encoding scheme is used based on the alphanumerals [a-z,0-9] as follows: 

	0123456789a c defghijk mn p rstuvwxyz  = 32 character alphabet
	             ^         ^  ^ ^ 
	             b         l  o q
	
	bloq = 4 Replacement symbols:
		b = 00
		l = 01
		o = 02
		q = 03

Using only lowercase the alphanumerals give us 36 individual tokens in our alphabet. 
To make things simpler, we take out 4 characters and use them as replacement symbols 
instead: `'b'`, `'l'`, `'o'` and `'q'`.
Now we end up with a 32 token alphabet, neatly encoding 5 bits per token.

We can use the replacement symbols to perform some 'compression'. Using the fact 
that all blocks will end with the characters `'00'`, `'01'`, `'02'` or `'03'` 
(for shards 0 .. 3) we can save one character off any block suid by replacing the 
character sequence by it's corresponding replacement symbol. This at the same time 
uniquely marks a suid as a block suid.

## Copyright
Copyright (c) 2015 by [Stijn de Witt](http://StijnDeWitt.com). Some rights reserved.

## License
Creative Commons Attribution 4.0 International (CC BY 4.0)
https://creativecommons.org/licenses/by/4.0/
