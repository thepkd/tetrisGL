function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

function rotateMatrix(block, dim) //Rotate a dimXdim matrix clockwise
{
  for(var i=0; i<dim; i++) //Transpose
  {
    for(let j=0; j<dim; j++)
    {
      if(j>=i)
      {
      let temp = block[i][j];
      block[i][j] = block[j][i];
      block[j][i] = temp;
      }
    }
  }

  //Reverse the rows
  for(let i=0; i<dim; i++)
  {
    for(let j=0; j<dim/2; j++)
    {
      let temp = block[i][j];
      block[i][j] = block[i][dim-1-j];
      block[i][dim-1-j] = temp;
    }
  }

}