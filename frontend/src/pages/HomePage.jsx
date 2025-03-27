function HomePage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to GitHub Clone</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          A self-hosted platform for managing code and collaborating with others
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md">
            Create Repository
          </button>
          <button className="border border-gray-300 hover:border-gray-400 px-6 py-2 rounded-md">
            Explore Projects
          </button>
        </div>
      </section>
      
      <section className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Manage Repositories</h2>
          <p className="text-gray-600">Create and maintain your code repositories with complete version control</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Track Issues</h2>
          <p className="text-gray-600">Organize your work with issue tracking and project management tools</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Collaborate Securely</h2>
          <p className="text-gray-600">Work together with team members using SSH and pull requests</p>
        </div>
      </section>
    </div>
  )
}

export default HomePage
