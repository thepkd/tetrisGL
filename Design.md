TETRIS GL:
Intro: A fun 3D Implementation of the basic Tetris game. 10x6 window. 5-6 custom shapes which fit in 3x3 box(They don't have to.). Initially design with a 1 second fall time.
Engine: Basic Set based implementation. Will maintain 2 10x6 arrays and based on setInterval function shift the first array down by 1 row until there is a possible set-intersection with the second array if there is a 1 row shift downwards. At that point Set-Union the 2 arrays, clear the first array and initalise it with one of our custom shapes at the top of the array(Call finish routine if new custom shape does not fit into frame). Iterate. Keep stats.

Possible Improvements:
1) More shapes. 
2) Shapes jiggle or rotate while movin down.
3) Clear full rows.