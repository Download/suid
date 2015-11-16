# ws.suid <sub><sup>v0.10.0</sup></sub>
**Distributed Service-Unique IDs that are short and sweet.**<br/>
[project website](http://download.github.io/suid/)

Suids are IDs that are:

* Short
* Unique across a service or site
* Ordered
* Easy for humans to read, write and pronounce
* 53 bits so they fit into a single Javascript or PHP Number, Java Long, SQL BigInt etc.
* Sweet!

## Download
* Commented (~7kB): [suid.js](https://github.com/Download/suid/releases/download/0.10.0/suid.js)
* Minified (~3 KB): [suid.min.js](https://github.com/Download/suid/releases/download/0.10.0/suid.min.js)
* Map file: [suid.min.js.map](https://github.com/Download/suid/releases/download/0.10.0/suid.min.js.map)

## CDN
* Commented: `//cdn.rawgit.com/download/suid/0.10.0/dist/suid.js`
* Minified : `//cdn.rawgit.com/download/suid/0.10.0/dist/suid.min.js`
* Map file : `//cdn.rawgit.com/download/suid/0.10.0/dist/suid.min.js.map`

## NPM
* `npm install --save-dev ws.suid`

## Bower
* `bower install download/suid --save`

## Usage
* Include suid.js on your webpage
* Configure the URL of the suid server
* Call `Suid.next()` to generate IDs
* Use options to provide seed data and control pool behavior

### Configure the URL of the suid server
This is the only mandatory configuration. Like all configuration in suid.js, it can be done in three ways:
* By setting a script attribute
* By calling `Suid.configure(options)`
* By creating a global configuration object

#### By setting a script attribute
You can pass the URL to the suid server right in the script tag by setting
the attribute `data-suid-server` to the URL of the server:
```xml
<script src="//cdn.rawgit.com/download/suid/0.10.0/dist/suid.min.js" 
        data-suid-server="/suid/suid.json"></script>
```

#### By calling `Suid.configure(options)`
Instead of using script attributes, once suid.js has loaded, you can call
`Suid.configure(options)`, where `options` is an options object:
```js
Suid.configure({server: '/suid.suid,json'});
```

#### By creating a global configuration object
Sometimes you want to set your configuration *before* loading your scripts. Suid.js allows for that.
If, by the time suid.js is loaded, an object exists in the global scope called `Suid`, suid.js will
pick it up and use it to configure itself before replacing it with the `Suid` function:
```
<script>var Suid = {server:'/suid/suid.json'};</script>
<script src="//cdn.rawgit.com/download/suid/0.10.0/dist/suid.min.js"></script>
```

### Call `Suid.next()` to generate IDs
```javascript
var myId = Suid.next();
alert(myId);             // 14she
alert(myId.valueOf());   // 1903154
var halve = myId / 2;
var halveId = new Suid(halve);
alert(halve);            // 951577
alert(halveId);          // ke8p
var src = {id: myId, name: 'test'};
var json = JSON.stringify(src);
alert(json);             // '{"id":"14she","name":"test"}'
var dst = JSON.parse(json, Suid.revive('id'));
alert(dst.id);           // 14she
```
*Don't create new IDs by adding to existing IDs!<br>
 Just call `Suid.next()` again.*

## Options
You can specify options by including the `data-suid-options` attribute in the script element 
and giving a pseudo-json options string, like so:
```xml
<script src="//cdn.rawgit.com/download/suid/0.10.0/dist/suid.min.js" 
		data-suid-server="suid/suid.json"
		data-suid-options="{'min':4, 'max':6, 'seed':['14she', '14sky']}"></script>
```
The pseudo-json is basically normal json but with single quotes instead of double.

When using the global configuration object or `Suid.configure` to specify options instead
of the script attributes, just add the extra options to the options object:
```js
// Before loading suid.js:
var Suid = {server:'/suid/suid.json', min:4, max:6, seed:['14she', '14sky']};
// or after loading suid.js:
Suid.configure({server:'/suid/suid.json', min:4, max:6, seed:['14she', '14sky']});
```

### Seed option
The seed option allows you to pre-configure suid.js with the first suid blocks,
so it will be able to generate ID's right away. If you don't provide seed blocks,
and no suid blocks are in the pool in localstorage, suid.js will fire an Ajax 
request right away to fetch the first blocks. This does however cause some latency
and a small period in which suid.js will not be able to serve any IDs.

To provide seed blocks, we generate suid blocks on the server on the first request
and pass them to suid.js in option `seed`, using any of the methods discussed above.

### Suid pool options
The suid script fetches suid blocks from the suid server and stores them in a pool in 
[localStorage](http://www.w3.org/TR/webstorage/#storage) 
([browser support](http://caniuse.com/#search=localstorage)). This pool is accessible from 
all tabs that are from the same domain, maximizing the efficient use of suid blocks. 

You can control the behaviour of the pool with two settings:
  
* `min`: Minimum number of suid blocks to keep in the pool, defaults to 3
* `max`: Maximum number of suid blocks to keep in the pool, defaults to 4

Option `min` determines how low the amount of blocks in the pool may become before the script 
will request new blocks from the server. Option `max` determines how many blocks the script 
will fetch during each request in order to fill the pool up again. If your application has 
moments in which it consumes a lot of IDs in a short timeframe, or if your application is expected 
to be used offline for prolonged periods, choose a `min` that ensures enough IDs will always be 
in the pool to supply those IDs. If you want to reduce the number of requests for ID blocks 
(at the expense of more ID blocks going wasted when caches are cleared etc) choose a `max` that 
is a number of blocks higher then your `min`.

At most 8 blocks can be requested from the pool simultaneously (when using `suid-server-java`) 
so bear this in mind when configuring your pool. I would guess that the default settings are 
good enough for most people.

## Suid pool exhausted exceptions
I have found that you will mostly get away with generating suids whenever you need them and
suid.js will be able to maintain the pool of suid blocks very effectively. However there is
always the possibility of the pool being empty for some reason. So if you want to play it safe
you should wrap calls to `Suid.next()` in a `try...catch` block as it will throw an error
when the pool is exhausted:
```js
try {
    var id = Suid.next();
} 
catch(e) {
    // deal with it somehow... Either schedule a retry or show an error etc
}
```

Once the pool is filled this will be a very rare occurance, but you are guaranteed
to get it when you have an empty localstorage and load a page containing this code:

```xml
<script src="//cdn.rawgit.com/download/suid/0.10.0/dist/suid.min.js" 
        data-suid-server="suid/suid.json"></script>
<script>
```
```js
var x = Suid.next();
```
```xml
</script>
```
This is because suid.js was not given any seed blocks and the first ajax request to
fill up the pool will not have returned yet. You can deal with this in three ways:
* By providing seed data as discussed above
* By ignoring this possibility (feasible if you only generate ID's after user interaction)
* By attaching a listener to `Suid.ready`

If the initial period with empty pool is all you fear, you can add a listener to
`Suid.ready` like this:

```js
Suid.ready(function(){
    var x = Suid.next(); // this will not fail
});
```

Personally I am not wrapping my calls to `Suid.next()` in a `try...catch` block, but
I like living on the edge. :)

## Need a server? 
Check out the Java EE implementation: [suid-server-java](http://download.github.io/suid-server-java/)

## API documentation

Please refer to the [Suid JS API documentation](https://cdn.rawgit.com/download/suid/0.10.0/doc/ws.suid.Suid.html) 
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
which allows an ID generator to generate up to 64 IDs without any further need
for communication with the server. It's implementation is inspired by 
[the mechanism Flickr uses](http://code.flickr.net/2010/02/08/ticket-servers-distributed-unique-primary-keys-on-the-cheap/)
for generating their IDs. Flickr however serves IDs one at a time, whereas Suid
servers hand out IDs in blocks of 64 to minimize network overhead and facilitate
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
The default representation of a Suid uses base-36, an alphabet with 36 different symbols 
(`0..9a..z`), and are easy for humans to read, write and pronounce, as well as URL-safe.
Using (only lowercase!) letters in addition to the decimals actually makes the IDs easier
for humans to work with, Just compare:

	14she
	1903154

Especially when having to read an ID to someone over the phone, adding in uppercase letters
and special symbols such as dash `-`, tilde `~` and underscore `_` makes the process very
error-prone and tedious.

## Technical background
The 53 bits in a suid are distributed over a 64-bit long as depicted below:

	                 HIGH INT                                         LOW INT
	 _______________________________________________________________________________________________
	|                                               |                                               |
	| 0000 0000 | 000b bbbb | bbbb bbbb | bbbb bbbb | bbbb bbbb | bbbb bbbb | bbbb bbbb | biii iiis |
	|_______________________________________________|_______________________________________________|
	
	0 = 11 reserved bits
	b = 46 block bits
	i = 6 ID bits
	s = 1 shard bit

The first 11 bits are reserved and always set to `0`. The next 46 bits are used for
the `block` number. These are handed out by a centralized server. Then there are 6 `ID`
bits which are to be filled in by the generator. The last bit is reserved for the `shard`
ID. To prevent a single point of failure, two separate hosts can be handing out ID's for 
a certain domain, each with their own `shard` ID (`0` or `1`).

When encoded to JSON, suids are represented as strings, e.g.: `'14she'`. The API offers 
a [toJSON](https://cdn.rawgit.com/download/suid/0.10.0/doc/ws.suid.Suid.html#toJSON) method, 
as well as a [revive](//cdn.rawgit.com/download/suid/0.10.0/doc/ws.suid.Suid.html#.Suid.revive) 
function that generates a reviver for a field in an object.

## Copyright
Copyright (c) 2015 by [Stijn de Witt](http://StijnDeWitt.com). Some rights reserved.

## License
[Creative Commons Attribution 4.0 International (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/)
