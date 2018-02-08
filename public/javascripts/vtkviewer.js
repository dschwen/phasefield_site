// insert interactive viewer

var vtkViewer = (function()
{
  const vtkFullScreenRenderWindow = vtk.Rendering.Misc.vtkFullScreenRenderWindow;
  var vtkDataArray = vtk.Common.Core.vtkDataArray;
  var vtkVolume = vtk.Rendering.Core.vtkVolume;
  var vtkVolumeMapper = vtk.Rendering.Core.vtkVolumeMapper;
  var vtkColorTransferFunction = vtk.Rendering.Core.vtkColorTransferFunction;
  var vtkActor = vtk.Rendering.Core.vtkActor;
  var vtkColorMaps =vtk.Rendering.Core.ColorTransferFunction.vtkColorMaps;
  var vtkMapper = vtk.Rendering.Core.vtkMapper;
  var vtkURLExtract = vtk.Common.Core.vtkURLExtract;
  var vtkXMLPolyDataReader =vtk.IO.XML.vtkXMLPolyDataReader;

  function createRenderer(el)
  {
    // create renderer
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
      rootContainer: el,
      containerStyle: {
        height: '20em',
        width: '100%',
        overflow: 'hidden'
      },
      background: [0, 0, 0]
    });

    return fullScreenRenderer.getRenderer();
  }

  function setData(data)
  {
    const vtpReader = vtkXMLPolyDataReader.newInstance();
    vtpReader.parseAsArrayBuffer(data);

    const lookupTable = vtkColorTransferFunction.newInstance();
    const source = vtpReader.getOutputData(0);
    const mapper = vtkMapper.newInstance({
      interpolateScalarsBeforeMapping: false,
      useLookupTableScalarRange: true,
      lookupTable,
      scalarVisibility: false,
    });
    const actor = vtkActor.newInstance();
    const scalars = source.getPointData().getScalars();
    const dataRange = [].concat(scalars ? scalars.getRange() : [0, 1]);
  }

  return {
    createRenderer: createRenderer
  };
});
