TETRIS GL:
![Game Cover](https://raw.githubusercontent.com/thepkd/tertrisGL/master/Tetris3D.png?token=ANDIXDFJSVZNP5SG2K6V44C7WKTVG)
Intro: A fun 3D Implementation of the basic Tetris game. 12x6 window configurable. 5-6 custom hardcoded shapes which fit in 2x2 box(configurable). Initially design with a 1 second fall time.
Engine: Basic Set based implementation. Will maintain 3 gameLengthxgameWidth arrays and based on setInterval function shift the first array down by 1 row until there is a possible set-intersection with the second array if there is a 1 row shift downwards. At that point Set-Union the 2 arrays, clear the first array and initalise it with one of our custom shapes at the top of the array(Call finish routine if new custom shape does not fit into frame). Iterate. Keep stats. Use arrow keys to translate and rotate box. 

Possible Improvements:
1) More shapes. 
2) Shapes jiggle or rotate while movin down.
3) Need to solve small bugs like checking for intersection before rotating or translating.
