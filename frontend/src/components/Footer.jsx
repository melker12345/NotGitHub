function Footer() {
  return (
    <footer className="bg-gray-800 text-white p-4">
      <div className="container mx-auto text-center">
        <p className="text-sm">GitHub Clone &copy; {new Date().getFullYear()}</p>
        <div className="mt-2 flex justify-center space-x-4">
          <a href="#" className="text-gray-400 hover:text-white">About</a>
          <a href="#" className="text-gray-400 hover:text-white">Terms</a>
          <a href="#" className="text-gray-400 hover:text-white">Privacy</a>
        </div>
      </div>
    </footer>
  )
}

export default Footer
