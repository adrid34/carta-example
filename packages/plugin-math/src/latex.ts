export default [
	{
		match:
			/\\(frac|tfrac|dfrac|sqrt|over|above|cfrac|binom|dbinom|brace|choose|tbinom|brack)(?![a-zA-Z0-9])/g,
		type: 'str'
	},
	{
		match:
			/\\(amalg|circledast|ldotp|rtimes&&|And|circledcirc|lor|setminus|ast|circleddash|lessdot|smallsetminus|barwedge|Cup|lhd|sqcap|bigcirc|cup|ltimes|sqcupmodmod|bmod|curlyveexmodaxmodax|moda|times|boxdot|curlywedge|mp|unlhd|boxminus|div|odot|unrhd|boxplus|divideontimes|ominus|uplus|boxtimes|dotplus|oplus|vee|bullet|doublebarwedge|otimes|veebar|Cap|doublecap|oslash|wedge|cap|doublecup|pmor|plusmn|wr|centerdot|land|rhd|circ|leftthreetimes|rightthreetimes|cdot|gtrdot|pmod|cdotp|intercal|pod)(?![a-zA-Z0-9])/g,
		type: 'class'
	},
	{
		match:
			/\\(mathscr|mathrm|mathbf|mathit|mathnormal|textbf|textit|textrm|bf|it|rm|bold|textup|textnormal|boldsymbol{Ab}|Bbb|text|bm|mathbb|mathsf|textmd|frak|textsf|mathtt|mathfrak|sf|texttt|mathcal|tt|cal)(?![a-zA-Z0-9])/g,
		type: 'insert'
	},
	{
		match:
			/\\(sum|prod|bigotimes|bigvee|int|coprod|bigoplus|bigwedge|iint|intop|bigodot|bigcap|iiint|smallint|biguplus|bigcup|oint|oiint|oiiint|bigsqcup)(?![a-zA-Z0-9])/g,
		type: 'func'
	},
	{
		match: /\\[a-zA-Z0-9]+/g,
		type: 'oper'
	},
	{
		match: /(\(|\)|\{|\}|\[|\])/g,
		type: 'esc'
	},
	{
		match: /[a-zA-Z]+/g,
		type: 'var'
	},
	{
		match: /[0-9]+/g,
		type: 'num'
	}
];
